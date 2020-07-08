﻿// <copyright file="helper.ts" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import { IPostType } from "../constants/resources";
import Resources from "../constants/resources";
import { TFunction } from "i18next";

/**
* Get localized post types.
* @param localize i18n TFunction recieved from props.
*/
export const getLocalizedPostTypes = (localize: TFunction): Array<IPostType> => {
    return Resources.postTypes.map((value: IPostType) => {
        switch (value.id) {
            case "1":
                value.name = localize("notStartedStatus");
                return value;
            case "2":
                value.name = localize("activeStatus");
                return value;
            case "3":
                value.name = localize("blockedStatus");
                return value;
            case "4":
                value.name = localize("closedStatus");
                return value;
            default:
                return value;
        }
    });
}

/**
* Get localized sort by filters.
* @param localize i18n TFunction recieved from props.
*/
export const getLocalizedSortBy = (localize: TFunction): Array<IPostType> => {
    return Resources.sortBy.map((value: IPostType) => {
        switch (value.id) {
            case "0":
                value.name = localize("sortByNewest");
                return value;
            case "1":
                value.name = localize("sortByPopularity");
                return value;
            default:
                return value;
        }
    });
}

/**
* Get random colors for avatar.
*/
export const generateColor = () => {
    return Resources.avatarColors[Math.floor(Math.random() * Resources.avatarColors.length)];
}

/**
* get initial of user names to show in avatar.
*/
export const getInitials = (userPostName: string) => {
    let fullName = userPostName;
    if (fullName) {
        let names = fullName.split(' '),
        initials = names[0].substring(0, 1).toUpperCase();

        if (names.length > 1) {
            initials += names[names.length - 1].substring(0, 1).toUpperCase();
        }

        return initials;
    }
}