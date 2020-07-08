// <copyright file="popup-more-menu.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Popup } from "@fluentui/react-northstar";
import { MoreIcon } from "@fluentui/react-icons-northstar";
import { IProjectDetails } from "./discover-wrapper-page";
import MoreMenuContent from "./more-menu-content";

import "../../styles/more-menu.css";

interface IPopupMoreMenu {
    cardDetails: IProjectDetails;
    projectDetails: Array<IProjectDetails>;
    onMenuItemClick: (key: any) => void;
    onJoinMenuItemClick: (projectId: string, isSuccess: boolean) => void;
    showJoinProjectMenu: boolean;
    showLeaveProjects: boolean;
    loggedInUserId: string;
    onEditSubmit: (editedCardDetails: any, isSuccess: boolean) => void;
    onCloseProjectButtonClick: (isSuccess: boolean, projectId: string) => void;
}

const PopupMoreMenu: React.FunctionComponent<IPopupMoreMenu> = props => {
    const [menuOpen, setMenuOpen] = React.useState(false);

	/**
    *Invoked while closing dialog. Set state to original values.
    */
    const onCancel = () => {
        setMenuOpen(false);
    }

	/**
	*Invoked when edit post detail is successful from dialog.
	*@param cardDetails Updated post details
	*@param isSuccess Boolean indication whether operation result
    */
    const onEditSubmit = (cardDetails: IProjectDetails, isSuccess: boolean) => {
        setMenuOpen(false);
        props.onEditSubmit(cardDetails, isSuccess);
    }

	/**
	*Invoked when menu item is clicked and passes back to parent component.
	*@param key Selected menu item key
    */
    const onItemClick = (key: number) => {
        if (key === 1 || key === 3) {
            setMenuOpen(false);
        }
        props.onMenuItemClick(key);
    }
    if (props.cardDetails.status === 4) {
        return <MoreIcon className="more-menu-icon-disabled" disabled />
    }
    else {
        if (props.cardDetails.status === 3) {
            if (props.cardDetails.isCurrentUserProject) {
                return (
                    <Popup
                        onOpenChange={(e, { open }: any) => setMenuOpen(open)}
                        open={menuOpen}
                        content={
                            <MoreMenuContent projectDetails={props.projectDetails} onJoinMenuItemClick={props.onJoinMenuItemClick} onCloseProjectButtonClick={props.onCloseProjectButtonClick} showLeaveProjects={props.showLeaveProjects} showJoinProjectMenu={props.showJoinProjectMenu} cardDetails={props.cardDetails} onCancel={onCancel} onEditSubmit={onEditSubmit} onMenuItemClick={onItemClick} />
                        }
                        trigger={<MoreIcon className="more-menu-icon" />}
                    />
                );
            }
            else {
                return (
                    <MoreIcon className="more-menu-icon-disabled" disabled />
                );
            }
            
        }
        else if (props.showJoinProjectMenu && (props.cardDetails.projectParticipantsUserIds.split(';').includes(props.loggedInUserId) || props.cardDetails.projectParticipantsUserIds.split(';').filter((userId) => userId !== "").length === props.cardDetails.teamSize))
        {
            return (
                <MoreIcon className="more-menu-icon-disabled" disabled />
            );
        }
        else {
            return (
                <Popup
                    onOpenChange={(e, { open }: any) => setMenuOpen(open)}
                    open={menuOpen}
                    content={
                        <MoreMenuContent projectDetails={props.projectDetails} onJoinMenuItemClick={props.onJoinMenuItemClick} onCloseProjectButtonClick={props.onCloseProjectButtonClick} showLeaveProjects={props.showLeaveProjects} showJoinProjectMenu={props.showJoinProjectMenu} cardDetails={props.cardDetails} onCancel={onCancel} onEditSubmit={onEditSubmit} onMenuItemClick={onItemClick} />
                    }
                    trigger={<MoreIcon className="more-menu-icon" />}
                />
            );
        }
    }
}

export default React.memo(PopupMoreMenu);