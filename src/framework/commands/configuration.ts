import { IModule } from "../module.ts";
import { ICommand, CommandContext } from "../command.ts";
import { EType, Helper } from "../helper.ts";
import { App } from "../core.ts";
import { Database } from "../database.ts";


var CommandConfigModuleDisable:ICommand = {
    name: "disable",
    alias: ["d"],
    argtypes: [
        {
            type:EType.String,
            name: "Module Name",
            optional: false
        }
    ],
    requiredPermission: "config.module.disable",
    subcommmands: [],
    useSubcommands: false,
    handle: async (c) => {
        var modlist = App.modules.slice(0).map(e=>e.name.toLowerCase())
        if (modlist.includes(c.args[0].toLowerCase())) {
            var cfg = (await c.getServerDoc()).modules
            if (!cfg.includes(c.args[0].toLowerCase())) {
                cfg.splice(cfg.findIndex(c.args[0].toLowerCase()))
                c.log(c.translation.success_generic,c.translation.config.module.success_disabled)
            } else {
                c.err(c.translation.error_generic,c.translation.config.module.error_already_disabled.replace("{0}",c.args[0][1]))
            }
        } else {
            c.err(c.translation.error_generic,c.translation.config.module.error_module_not_found.replace("{0}",c.args[0][1]))
        }
        
    }
}

var CommandConfigModuleEnable:ICommand = {
    name: "enable",
    alias: ["e"],
    argtypes: [
        {
            type: EType.String,
            name: "Module Name",
            optional: false
        }
    ],
    requiredPermission: "config.module.enable",
    subcommmands: [],
    useSubcommands: false,
    handle: async (c) => {
        
        var modlist = App.modules.slice(0).map(e=>e.name.toLowerCase())
        if (modlist.includes(c.args[0].toLowerCase())) {
            var cfg = (await c.getServerDoc()).modules
            if (!cfg.includes(c.args[0].toLowerCase())) {
                cfg.push(c.args[0].toLowerCase())
                c.log(c.translation.success_generic,c.translation.config.module.success_enabled)
            } else {
                c.err(c.translation.error_generic,c.translation.config.module.error_already_enabled.replace("{0}",c.args[0]))
            }
        } else {
            c.err(c.translation.error_generic,c.translation.config.module.error_module_not_found.replace("{0}",c.args[0]))
        }
    }
}


var CommandConfigurationLanguage:ICommand = {
    name: "language",
    alias: ["lang","lg"],
    requiredPermission: null,
    argtypes: [
        {
            name: "Language Code",
            optional: false,
            type: EType.String
        }
    ],
    subcommmands: [],
    useSubcommands: false,
    handle: async (c:CommandContext) => {
        var lc = c.args[0]
        if (await Database.collectionTranslation.find({lang: lc})){
            c.err("ERROR", "Language Code invalid");
            return
        }
        var ua = await c.getAuthorDoc()
        ua.language = lc.toLowerCase();
        c.log("Settings changed successfully!","The next time you run any command, the language will be updated.");
        
    }
}



var CommandConfigModule:ICommand = {
    name: "module",
    alias: ["mod"],
    useSubcommands: true,
    subcommmands: [
        CommandConfigModuleEnable,
        CommandConfigModuleDisable
    ],
    argtypes: [],
    requiredPermission: "config.module.default",
    handle: (c)=>{}
}



export var ModuleConfiguration:IModule = {
    name: "config",
    commands: [
        CommandConfigModule,
        CommandConfigurationLanguage
    ],
    handlers: [],
    init: async () => {
        
    }
}