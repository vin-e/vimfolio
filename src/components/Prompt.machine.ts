import { Machine, assign } from 'xstate';
import { pure } from 'xstate/lib/actions';
import Command from '../shared/Commands';

type TypedCommand = {
   command: string
   response?: string[]
}

/**
 * This interface, used below initially with `Machine<PromptContext>` defines
 * the optional data storage within xState. Context is not a required step and 
 * is not used in the demo machines (toggle, stop light) on the xstate documentation.
 */
interface PromptContext {
  currentCommand: string
  executedCommands: TypedCommand[]
}

const PromptMachine = Machine<PromptContext>({
  // initial defines the starting state
  initial: 'booting',
  // initialize the context value(s)
  context: {
    currentCommand: '',
    executedCommands: []
  },
  states: {
    /**
     * The booting state is to give the useRef's a chance to bind and render. Then using a useEffect to immediate get us to the ready state
     * If we did not have the references this state would be useless.
     */
    booting: {
      on: {
        BOOTED: 'ready'
      }
    },
    ready: {
      activities: ['setFocusEvents'],
      initial: 'notFocused',
      states: {
        focused: {
          entry: 'setInputFocused',
          on: {
            FOCUS: {
              actions: 'setInputFocused'
            },
            NOT_FOCUSED: 'notFocused',
            KEY_DOWN: {
              cond: 'hasPressedEnter',
              actions: ['setExecutedCommand', 'clearCommandInput']
            },
            UPDATE_CURRENT_COMMAND: { actions: 'updateCurrentCommand' }
          }
        },
        notFocused: {
          on: {
            FOCUS: 'focused'
          }
        }
      }
    }
  }
}, {
  guards: {
    hasPressedEnter: (_: PromptContext, event: any) => event.key === 'Enter'
  },
  actions: {
    setExecutedCommand: pure((context: PromptContext) => {
      const requestedCommand = context.currentCommand
      if (!requestedCommand) return undefined

      if (requestedCommand === 'clear') {
        return assign((_: PromptContext) => ({
          currentCommand: '',
          executedCommands: []
        }))
      }
      
      const response = Command[requestedCommand]
      return assign({
        currentCommand: '',
        executedCommands: [
          ...context.executedCommands,
          {
            command: requestedCommand,
            response: Array.isArray(response) ? response : [response]
          }
        ]
      })
    }),
    updateCurrentCommand: assign((_: PromptContext, event: any) => ({
      currentCommand: event.target.value
    }))
  }
})

export default PromptMachine