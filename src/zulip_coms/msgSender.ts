/**
 * This module is responsible for sending messages to end user
 * sent from our server --> bot/zulip server
 */

import axios from 'axios';
import { ICliAction } from './interface';

// TODO: make a sendMessage (takes in message type etc.)
export enum messageTypeEnum {
  'PROMPT_SIGNUP',
  'SIGNUP',

  // CLI Update-related cmds
  'UPDATE_DAYS',
  'UPDATE_SKIP',
  'UPDATE_WARNINGS',

  // CLI Get-related cmds
  'STATUS_DAYS',
  'STATUS_SKIP',
  'STATUS_WARNINGS'
}
export interface IMsgSenderArgs {
  status: 'OK' | 'ERROR';
  messageType: messageTypeEnum;
  payload?: any;
  message?: string;
  cliAction?: ICliAction;
}

export function zulipMsgSender(
  toEmail: string | string[],
  msgOpt: IMsgSenderArgs
): void {
  let messageContent;
  switch (msgOpt.messageType) {
    ////////////////////////
    // Messages related to non-signed up users
    ////////////////////////
    case messageTypeEnum.PROMPT_SIGNUP:
      messageContent = `You are not currently signed up as a user of coffee chats
      Type SIGNUP to join`;
      break;

    case messageTypeEnum.SIGNUP:
      if (msgOpt.status === 'OK') {
        messageContent = `You've successfully been added to coffee chat!
        Type HELP or learn more at [github.com/thechutrain/rc-coffee-chats](https://github.com/thechutrain/rc-coffee-chats)`;
      } else {
        messageContent = `Failed to sign you up`;
      }
      break;

    ////////////////////////
    // CHANGE messages
    ////////////////////////
    case messageTypeEnum.UPDATE_DAYS:
      if (msgOpt.status === 'OK') {
        messageContent = `You have successfully updated your coffee chat days.`;
      } else {
        messageContent = `Sorry there was an error updating your coffee chat day. If this is a bug, please fill out an issue @ [${
          process.env.GITHUB_URL
        }](${process.env.GITHUB_URL})`;
      }
      break;

    case messageTypeEnum.UPDATE_WARNINGS:
      if (msgOpt.status === 'OK') {
        const warningsOnOff = msgOpt.payload.warning_exception ? 'ON' : 'OFF';
        messageContent = `You've successfully updated your warning settings.
        warnings exceptions are set to be ${warningsOnOff}`;
      } else {
        messageContent = `Sorry there was an error updating your settings. If this is a bug, please fill out an issue @ [${
          process.env.GITHUB_URL
        }](${process.env.GITHUB_URL})`;
      }
      break;

    case messageTypeEnum.UPDATE_SKIP:
      if (msgOpt.status === 'OK') {
        const skipping = msgOpt.payload.skip_next_match ? ' NOT' : '';
        messageContent = `You've successfully updated your "skip_next_match" settings. 
        
        You will${skipping} be skipping your next match.`;
      } else {
        messageContent = `Sorry there was an error updating your settings. If this is a bug, please fill out an issue @ [${
          process.env.GITHUB_URL
        }](${process.env.GITHUB_URL})`;
      }
      break;

    ////////////////////////
    // STATUS messages
    ////////////////////////
    case messageTypeEnum.STATUS_DAYS:
      const daysAsString = msgOpt.payload.coffeeDays.join(' ');
      messageContent = `You are currently set to have coffee chats on the following days: ${daysAsString}`;
      break;

    case messageTypeEnum.STATUS_WARNINGS:
      // TODO: handle errors?
      const warningsText = msgOpt.payload.warningException ? 'ON' : 'OFF';
      // const willOrWillNot = msgOpt.payload.warningException ? 'WILL' : 'WILL NOT'
      messageContent = `Your reminder warnings are currently set to be: ${warningsText}`;
      break;

    case messageTypeEnum.STATUS_SKIP:
      const { skipNext } = msgOpt.payload;
      messageContent = `You will ${
        skipNext ? '' : 'NOT'
      } be skipping your next match. `;
      break;

    default:
      const headerText =
        msgOpt.status === 'ERROR' ? 'DEFAULT ERROR MSG: ' : 'DEFAULT OK MSG: ';

      messageContent = `${headerText} 
        payload: ${msgOpt.payload}
        message: ${msgOpt.message}
        cli: ${JSON.stringify(msgOpt.cliAction)}
        `;

      break;
  }

  sendGenericMessage(toEmail, messageContent);
}

export function sendGenericMessage(
  toEmail: string | string[],
  messageContent: string
) {
  // example: link See [${matchedName.split(" ")[0]}'s profile](https://www.recurse.com/directory?q=${encodeURIComponent(matchedName)})
  // const testMessage = `Hi you're @**Alan Chu (W1\'18)** my name is *coffee-bot*`;
  const rawData = {
    type: 'private',
    to: toEmail instanceof Array ? toEmail.join(', ') : toEmail,
    content: encodeURIComponent(messageContent)
  };

  const dataAsQueryParams = Object.keys(rawData)
    .map(key => `${key}=${rawData[key]}`)
    .join('&');

  return axios({
    method: 'post',
    baseURL: process.env.ZULIP_URL_ENDPOINT,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: process.env.ZULIP_BOT_USERNAME,
      password: process.env.ZULIP_BOT_API_KEY
    },
    data: dataAsQueryParams
  });
}
