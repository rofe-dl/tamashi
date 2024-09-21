import 'discord.js';
import { Collection } from 'discord.js';
import { ICommand } from './command.type';
import { Shoukaku } from 'shoukaku';

// using type declaration to extend built in types of libraries
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, ICommand>;
    shoukaku: Shoukaku;
  }
}
