class ID {
    static participateToConquest() {
        return 'participate'
    }

    static searchForOpponent() {
        return 'new-match'
    }

    static weaponsClassSelectionMenu(matchId) {
        return `weapons-class-menu-${matchId}`
    }

    static weaponsCategorySelectionMenu(matchId) {
        return `weapons-category-menu-${matchId}`
    }
    static weaponsSelectionMenu(matchId, categoryId) {
        return `weapons-selection-menu-${categoryId}-${matchId}`
    }

    static weaponsButtonSelection(matchId) {
        return `weapons-${matchId}`
    }

    static weaponsSelectionUpdateMenu(matchId) {
        return `weapons-action-menu-${matchId}`
    }

    static weaponsSelectionValidate(matchId) {
        return `weapons-validate-selection-${matchId}`
    }
    static weaponsSelectionValidateVerified(matchId) {
        return `weapons-validate-selection-verified-${matchId}`
    }

    static optionPreviousSelection() {
        return 'weapons-action-menu-previous-selection'
    }
    static optionPreviousSelectionForMap() {
        return "weapons-action-menu-previous-selection-map"
    }
    static optionPredefinedClassSelection() {
        return 'weapons-action-menu-class'
    }
    static optionManualSelection() {
        return 'weapons-action-menu-manual'
    }

    static matchRulesButton(matchId) {
        return `rules-${matchId}`
    }
}

module.exports = ID;
