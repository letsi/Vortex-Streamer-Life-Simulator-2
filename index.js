const path = require('path');
const { fs, log, util } = require('vortex-api');

const STEAMAPP_ID = '2890830';
const GAME_ID = 'streamerlifesimulator2';
const BEPINEX_PATH = 'BepInEx';

function main(context) {
    context.registerGame({
        id: GAME_ID,
        name: 'Streamer Life Simulator 2',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: [],
        queryModPath: () => '',
        logo: 'gameart.jpg',
        executable: () => 'Streamer Life Simulator 2.exe',
        requiredFiles: [
            'Streamer Life Simulator 2.exe',
			'UnityPlayer.dll',
        ],
        setup: prepareForModding,
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: STEAMAPP_ID,
        },
    });
    return true;
}

function findGame() {
    return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
        .then(game => path.join(game.gamePath, "windows_content"));
}

async function prepareForModding(discovery) {
    const modPaths = [
        path.join(discovery.path, BEPINEX_PATH)
    ];
    try {
        await Promise.all(modPaths.map((m) => fs.ensureDirWritableAsync(m)));
        return Promise.resolve();
    } catch (err) {
        log('error', 'Failed to prepare for modding', err);
        return Promise.reject(err);
    }
}

module.exports = {
    default: main,
};