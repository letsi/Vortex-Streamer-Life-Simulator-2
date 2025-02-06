const path = require('path');
const { fs, log, selectors, util, actions } = require('vortex-api');

const STEAMAPP_ID = '2890830';
const GAME_ID = 'streamerlifesimulator2';
const BEPINEX_MOD_ID = "1";
const BEPINEX_PATH = 'BepInEx';
const BEPINEX_WINHTTP_FILE_NAME = 'winhttp.dll';

function main(context) {
    context.requireExtension('modtype-bepinex');
    context.registerGame({
        id: GAME_ID,
        name: 'Streamer Life Simulator 2',
        logo: 'gameart.jpg',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => '',
        executable: () => 'Streamer Life Simulator 2.exe',
        setup: (discovery) => prepareForModding(context.api, discovery),
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
}

function findGame() {
    return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
        .then(game => path.join(game.gamePath, "windows_content"));
}

async function prepareForModding(api, discovery) {
    const modPaths = [
        path.join(discovery.path, BEPINEX_PATH)
    ];
    try {
        await Promise.all(modPaths.map((m) => fs.ensureDirWritableAsync(m)));
        await bepinexRequirement(api, discovery);
        return Promise.resolve();
    } catch (err) {
        log('error', 'Failed to prepare for modding', err);
        return Promise.reject(err);
    }
}

async function bepinexRequirement(api, discovery) {
    try {
        await fs.statAsync(path.join(discovery.path, BEPINEX_WINHTTP_FILE_NAME));
    } catch (err) {
        const modFiles = await api.ext.nexusGetModFiles(GAME_ID, BEPINEX_MOD_ID);

        const fileTime = (input) => Number.parseInt(input.uploaded_time, 10);

        const file = modFiles
            .filter(file => file.category_id === 1)
            .sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];

        if (!file) {
            throw new Error('ERROR: BepInEx Pack - Streamer Life Simulator 2 file not found!');
        }

        const dlInfo = {
            game: GAME_ID,
            name: 'BEPINEXPACK',
        };

        const nxmUrl = `nxm://${GAME_ID}/mods/${BEPINEX_MOD_ID}/files/${file.file_id}`;
        const dlId = await new Promise((resolve, reject) => {
            api.events.emit('start-download', [nxmUrl], dlInfo, undefined, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }, undefined, { allowInstall: false });
        });

        const modId = await new Promise((resolve, reject) => {
            api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        const profileId = selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
        await actions.setModsEnabled(api, profileId, [modId], true, {
            allowAutoDeploy: true,
            installed: true,
        });
    }
}

module.exports = {
    default: main,
};