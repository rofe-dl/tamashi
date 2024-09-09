import winston, { Logger, Logform, transports, format } from 'winston';
import Transport, { TransportStreamOptions } from 'winston-transport';
import axios from 'axios';
import config from 'config.json';

const winstonConfig = {
  levels: {
    error: 0,
    info: 1,
  },
  colors: {
    error: 'bold underline redBG',
    info: 'underline green',
  },
  toStrings: {
    error: 'Error',
    info: 'Info',
  },
};

winston.addColors(winstonConfig.colors);

class DiscordWebhook extends Transport {
  constructor(opts: TransportStreamOptions) {
    super(opts);
  }

  override log(info: Logform.TransformableInfo, callback: () => void) {
    notifyDiscord(info);
    callback();
  }
}

const logger: Logger = winston.createLogger({
  silent: config.NODE_ENV === 'test', // wont log in test environments
  levels: winstonConfig.levels,
  level: 'info',
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf((info: Logform.TransformableInfo) => {
      let levelAsString: string = info.level.toString();
      levelAsString =
        winstonConfig.toStrings[
          levelAsString as keyof typeof winstonConfig.toStrings
        ];

      let printFormat = `(${config.NODE_ENV?.toUpperCase()}) ${
        info.timestamp
      } [${levelAsString}]: ${info.message}`;

      // show stack trace if it's an error
      if (info.stack && info.level == 'error') {
        printFormat += ` \n${info.stack}`;
      }

      return printFormat;
    }),
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize({ all: true })),
    }),
    new DiscordWebhook({
      level: 'error',
    }),
  ],
});

function notifyDiscord(err: Logform.TransformableInfo): void {
  let body = JSON.stringify(
    {
      errorMessage: err.message,
      errorStack: err.stack,
    },
    null,
    2,
  ).replace(/\\n/g, '\n'); // replaces '\n' with actual line breaks

  axios
    .post(
      config.webhookURL as string,
      {
        content: `\`\`\`json\n${body}\n\`\`\``,
        username: 'Tamashi [' + config.NODE_ENV + ']',
        avatar_url: config.avatarURL as string,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
    .catch((err) => {});
}

export default logger;
