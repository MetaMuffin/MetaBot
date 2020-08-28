import { Database } from "./database";
import { IModule } from "./module";
import { Helper } from "./helper";
import { ICommand, CommandContext} from './command';
import { loadNativeCommands } from "./commands/loader";
import { HandlerContext } from "./handler";
import { InterfaceHandler } from "./interfacing";
import { Client, MessageReaction, User, Message } from "discord.js";


export class App {
    public static client: Client;
    public static prefix: string = "}";
    public static workspace: string;
    public static modules: Array<IModule> = [];

    
    setWorkspace(path:string):void {
        App.workspace = path;
    }

    async init() {
        await Database.init()
        App.client = new Client({});
        App.client.login(Database.globals.secret)
        loadNativeCommands()
        await Promise.all(App.modules.map(m => m.init))
    }
    
    public static reactionHandler(reaction:MessageReaction, user:User):void {
        InterfaceHandler.onReaction(reaction,user)
    }

    public static async messageHandler(message: Message):Promise<void> {
        if (message.author.id == App.client.user?.id) return
        
        if (InterfaceHandler.onMessage(message)) return        

        let isCommand:boolean = message.content.startsWith(App.prefix)
        let c_names:Array<string> = [];
        if (isCommand){
            c_names = Helper.getCommandNames(message.content)
        }
        
        let foundCommand:boolean = false;
        var activeModules:Array<string> = (await Database.getServerDoc(message.guild.id)).enabledModules;
        for (const m of App.modules) {
            if (!activeModules.includes(m.name)) continue;
            if (isCommand){
                for (const h of m.commands){
                    var res = App.getMatchingCommand(h,c_names)
                    if (res.command != null){
                        console.log("Found a matching command for " + message.content.split(" ")[0]);
                        foundCommand = true;

                        let context:CommandContext = new CommandContext(message,m,[],res.command,res.names)
                        if (Helper.ensurePermission(context,h.requiredPermission)){
                            console.log("Handling this Command.");
                            res.command.handle(context)
                        } else {
                            console.log("Permission denied.");
                        }
                    }
                }
            }
            for (const handler of m.handlers) {
                if (message.content && handler.regex.test(message.content)){
                    var context = new HandlerContext(message,handler)
                    if (Helper.ensurePermission(context,handler.enablePermission,handler.doPermissionError) && (!Helper.ensurePermission(context,handler.disablePermission,false))) {
                        handler.handle(context)
                    }
                }
            }
        }
        if (isCommand && !foundCommand){
            message.reply("Command not found.")
        }
    }

    public static getMatchingCommand(command:ICommand, names:Array<string>):{command:ICommand|null,names:Array<string>} {
        if (!(names && names.length > 0)) return {command:null,names:[]};
        if (!((command.name == names[0].toLowerCase()) || (command.alias.includes(names[0].toLowerCase())))) return {command:null,names:[]};
        
        var names_shifted:Array<string> = names.slice(0)
        names_shifted.shift()

        if (!command.useSubcommands){
            return {command:command,names:names_shifted}
        } else {
            
            for (const c of command.subcommmands) {
                var res = this.getMatchingCommand(c,names_shifted)
                if (res.command != null) {
                    return res
                }
            }
            return {command:null,names:[]};
        }
    }
}
