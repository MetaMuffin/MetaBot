import { IModule } from "../module";
import { ICommand, CommandContext } from "../command";
import { EType, Helper } from "../helper";
import { App } from "../core";
import { Database } from "../database";

var CommandConfigModuleDisable: ICommand = {
    name: "disable",
    alias: ["d"],
    argtypes: [
        {
            type: EType.String,
            name: "Module Name",
            optional: false
        }
    ],
    requiredPermission: "config.module.disable",
    subcommmands: [],
    useSubcommands: false,
    handle: async (c) => {
        var modlist = App.modules.slice(0).map(e => e.name.toLowerCase())
        if (modlist.includes(c.args[0].toLowerCase())) {
            var sc = (await c.getServerDoc())
            if (!sc.enabledModules.includes(c.args[0].toLowerCase())) {
                sc.enabledModules.splice(sc.enabledModules.findIndex(c.args[0].toLowerCase()))
                await Database.updateServerDoc(sc)
                c.log(c.translation.success_generic, c.translation.config.module.success_disabled)
            } else {
                c.err(c.translation.error_generic, c.translation.config.module.error_already_disabled.replace("{0}", c.args[0][1]))
            }
        } else {
            c.err(c.translation.error_generic, c.translation.config.module.error_module_not_found.replace("{0}", c.args[0][1]))
        }
    }
}

var CommandConfigModuleEnable: ICommand = {
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
        var modlist = App.modules.slice(0).map(e => e.name.toLowerCase())
        if (modlist.includes(c.args[0].toLowerCase())) {
            var sc = (await c.getServerDoc())
            if (!sc.enabledModules.includes(c.args[0].toLowerCase())) {
                sc.enabledModules.push(c.args[0].toLowerCase())
                await Database.updateServerDoc(sc)
                c.log(c.translation.success_generic, c.translation.config.module.success_enabled)
            } else {
                c.err(c.translation.error_generic, c.translation.config.module.error_already_enabled.replace("{0}", c.args[0]))
            }
        } else {
            c.err(c.translation.error_generic, c.translation.config.module.error_module_not_found.replace("{0}", c.args[0]))
        }
    }
}


var CommandConfigurationLanguage: ICommand = {
    name: "language",
    alias: ["lang", "lg"],
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
    handle: async (c: CommandContext) => {
        var lc: string = c.args[0]
        if (!await Database.getTranslationByName(lc.toLowerCase())) {
            if (lc.length != 2) return c.err("ERROR", "Language Code invalid");
            c.err("This language is missing", "The language you selected is not yet availible. Feel free to contribute to Metabot by translating. https://www.github.com/MetaMuffin/Metabot")
            return
        }
        var ua = await c.getAuthorDoc()
        ua.language = lc.toLowerCase();
        await c.updateAuthorDoc(ua)
        c.log("Settings changed successfully!", "The next time you run any command, the language will be updated.");
    }
}



var CommandConfigModule: ICommand = {
    name: "module",
    alias: ["mod"],
    useSubcommands: true,
    subcommmands: [
        CommandConfigModuleEnable,
        CommandConfigModuleDisable
    ],
    argtypes: [],
    requiredPermission: "config.module.default",
    handle: (c) => { }
}



export var ModuleConfiguration: IModule = {
    name: "config",
    commands: [
        CommandConfigModule,
        CommandConfigurationLanguage
    ],
    handlers: [],
    init: async () => {

    }
}