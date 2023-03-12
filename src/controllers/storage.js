const storage = require('node-persist').create();

/**
 * @typedef {{ name: string, description: string }} MemberInfo
 * @typedef {{ rulesSource: string, description: string }} NetworkInfo
 */

exports.init = init;
async function init() {
    const v1 = require('node-persist').create();
    await v1.init({ dir: 'etc/storage' });
    await storage.init({ dir: 'etc/storage-v2' });
    const version = await v1.getItem('version') || 1;
    let newVersion = version;

    if (newVersion === 1) {
        await v1.forEach(async (key, value) => {
            await storage.setItem('member-' + key, { name: value });
        });
        newVersion = 2;
        await v1.setItem('version', newVersion);
    }

    if (newVersion != version) {
        console.info(`Storage version changed: ${version} -> ${newVersion}`);
    }
}


exports.set_member = set_member;
/**
 * @param {string} id
 * @param {MemberInfo} member
 */
async function set_member(id, member) {
    await storage.setItem('member-' + id, member);
}


exports.get_member = get_member;
/**
 * @param {string} id
 * @returns {Promise<MemberInfo>}
 */
async function get_member(id) {
    /** @type {MemberInfo} */
    const member = await storage.getItem('member-' + id) || {};
    if (!member.name) member.name = '';
    if (!member.description) member.description = '';
    return member;
}


exports.delete_member = delete_member;
async function delete_member(id) {
    await storage.removeItem('member-' + id);
}


exports.set_network = set_network;
/**
 * @param {string} id
 * @param {NetworkInfo} network
 */
async function set_network(id, network) {
    await storage.setItem('network-' + id, network);
}


exports.get_network = get_network;
/**
 * @param {string} id
 * @returns {Promise<NetworkInfo>}
 */
async function get_network(id) {
    /** @type {NetworkInfo} */
    const network = await storage.getItem('network-' + id) || {};
    if (!network.rulesSource) network.rulesSource = '';
    if (!network.description) network.description = '';
    return network;
}


exports.delete_network = delete_network;
async function delete_network(id) {
    await storage.removeItem('network-' + id);
}
