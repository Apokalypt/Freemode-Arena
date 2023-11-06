/**
 * @param {{ category: string; name: string }} weapon
 * @returns {string}
 */
function getWeaponId(weapon) {
    return `${weapon.category} - ${weapon.name}`;
}

module.exports = {
    getWeaponId
}
