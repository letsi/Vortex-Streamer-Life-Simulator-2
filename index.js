const path = require('path');
const { fs, util } = require('vortex-api');

const STEAMAPP_ID = '2890830';
const GAME_ID = 'streamerlifesimulator2';
const BEPINEX_PATH = 'BepInEx';
const BEPINEX_PLUGIN_PATH = 'plugins';

function main(context) {
    context.requireExtension('modtype-bepinex');
    context.registerGame({
        id: GAME_ID,
        name: 'Streamer Life Simulator 2',
        logo: 'gameart.jpg',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => path.join(BEPINEX_PATH, BEPINEX_PLUGIN_PATH),
        executable: () => 'Streamer Life Simulator 2.exe',
        setup,
        requiredFiles: [
            'Streamer Life Simulator 2.exe',
            'UnityPlayer.dll',
        ],
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: STEAMAPP_ID,
        },
    });

    context.once(() => {
        if (context.api.ext.bepinexAddGame !== undefined) {
            context.api.ext.bepinexAddGame({
                gameId: GAME_ID,
                autoDownloadBepInEx: true,
                customPackDownloader: () => {
                    return {
                        gameId: GAME_ID,
                        domainId: GAME_ID,
                        modId: '1',
                        fileId: '1',
                        archiveName: 'BepInEx Pack - Streamer Life Simulator 2.zip',
                        allowAutoInstall: true,
                    };
                },
                doorstopConfig: {
                    doorstopType: 'default',
                    ignoreDisableSwitch: true,
                }
            });
        }
    });
}

function findGame() {
    return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
        .then(game => path.join(game.gamePath, "windows_content"));
}

function setup(discovery) {
    const pluginsPath = path.join(discovery.path, BEPINEX_PATH, BEPINEX_PLUGIN_PATH);

    return fs.statAsync(pluginsPath)
        .then(stat => {
            if (!stat.isDirectory()) {
                throw new Error(`${pluginsPath} exists but is not a directory`);
            }
        })
        .catch(err => {
            if (err.code === 'ENOENT') {
                return fs.ensureDirAsync(pluginsPath);
            } else {
                throw err;
            }
        })
        .then(() => {
            return fs.ensureDirWritableAsync(pluginsPath);
        });
}

module.exports = {
    default: main,
};