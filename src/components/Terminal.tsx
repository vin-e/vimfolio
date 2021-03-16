import { FC, Fragment, useEffect, useRef } from 'react';
import styled from 'styled-components/macro';
import { asEffect, useMachine } from '@xstate/react';

import PromptMachine from './Prompt.machine'

const RED = 'rgb(255 91 82)';
const YELLOW = 'rgb(230 192 41)';
const GREEN = '#53c22c';

const Terminal: FC = () => {
  const terminalWrapperRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLInputElement | null>(null);

  const [state, send] = useMachine(PromptMachine.withConfig({
    activities: {
      setFocusEvents: () => {
        const listener = (event: any) => {
          if (!terminalWrapperRef.current || terminalWrapperRef.current.contains(event.target)) {
            send('FOCUS');
          } else {
            send('NOT_FOCUSED');
          }
        }
        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)
        return () => {
          document.removeEventListener('mousedown', listener);
          document.removeEventListener('touchstart', listener);
        }
      }
    },
    actions: {
      clearCommandInput: asEffect(() => {
        textAreaRef.current!.value = ''
      }),
      setInputFocused: asEffect(() => {
        textAreaRef.current!.focus();
      })
    }
  }))

  useEffect(() => {
    send('BOOTED')
  }, [send])

  return (
    <Wrapper ref={terminalWrapperRef}>
      <ActionBar>
        <CloseButton />
        <MinimizeButton />
        <FullScreenButton />
      </ActionBar>
      <Console>
        <LastLogin>Last login: Sun Mar 14 23:14:25 on ttys001</LastLogin>
        <PromptWrapper>
          <HiddenTextArea
            ref={textAreaRef}
            onKeyDown={({key, target}: any) => send('KEY_DOWN', {key, target})}
            onChange={(e: any) => {
              send('UPDATE_CURRENT_COMMAND', {target: e.target});
            }}
          />
          {state.context.executedCommands.map((line, i) => {
            return (
              <Fragment key={`${i}-${line.command}`}>
                <Line>
                  <User>[root ~]$&nbsp;</User>
                  <Input>{line.command}</Input>
                </Line>
                {line.response && line.response.length && <span style={{ color: 'white' }}>{line.response.join(' ')}</span>}
              </Fragment>
            );
          })}
          <Line>
            <User>[root ~]$&nbsp;</User>
            <Input>{state.context.currentCommand}</Input>
            {state.matches('ready.focused') && <Cursor />}
          </Line>
        </PromptWrapper>
      </Console>
    </Wrapper>
  );
};

const LastLogin = styled.div`
  color: white;
  margin-bottom: 7px;
`;
const Wrapper = styled.div`
  font-family: 'Roboto Mono', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 400px;
  width: 700px;
`;
const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  height: 22px;
  padding: 7px;
  background: #3a3a3b;
`;
const Console = styled.div`
  padding: 3px;
  background: #151516;
  flex: 1;
`;
const BaseButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  border-radius: 50%;
  height: 10px;
  width: 10px;
  & + & {
    margin-left: 5px;
  }
`;
const CloseButton = styled(BaseButton)`
  background: ${RED};
`;
const MinimizeButton = styled(BaseButton)`
  background: ${YELLOW};
`;
const FullScreenButton = styled(BaseButton)`
  background: ${GREEN};
`;

const PromptWrapper = styled.div``;
const Line = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  line-height: 25px;
`;
const User = styled.span`
  color: limegreen;
`;
const Input = styled.pre`
  color: white;
`;
const HiddenTextArea = styled.input`
  position: absolute;
  left: -16px;
  top: 0;
  width: 20px;
  height: 16px;
  background: transparent;
  border: none;
  color: transparent;
  outline: none;
  padding: 0;
  resize: none;
  z-index: 1;
  overflow: hidden;
  white-space: pre;
  text-indent: -9999em;
`;
const Cursor = styled.span`
  display: inline-block;
  background: #b6b6b6;
  margin-left: 2px;
  width: 12px;
  height: 22px;
`;

export default Terminal;
