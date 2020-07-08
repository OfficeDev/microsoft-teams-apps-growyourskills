// <copyright file="popup-menu-wrapper.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Popup, Button } from "@fluentui/react-northstar";
import { ChevronDownIcon } from "@fluentui/react-icons-northstar";
import PopupMenuCheckboxesContent from "./popup-menu-checkboxes-content";
import PopupMenuRadiogroupContent from "./popup-menu-radiogroup-content";

import "../../styles/popup-menu.css";

interface IPopupMenuWrapperProps {
	checkboxes?: Array<any>,
	radioGroup?: Array<any>,
	title: string,
	selectedSortBy?: string,
	showSearchBar?: boolean,
	onCheckboxStateChange: (typeState: Array<any>) => void,
    onRadiogroupStateChange: (selectedValue: string) => void,
}

const PopupMenuWrapper: React.FunctionComponent<IPopupMenuWrapperProps> = props => {
	const [popup, onOpenChange] = React.useState({ isOpen: false });

	if (props.checkboxes) {
		return (
			<Popup
				open={popup.isOpen}
				align="end"
                position="below"
                onOpenChange={(e, { open }: any) => onOpenChange({ isOpen: open })}
				trigger={<Button content={props.title} className={`${popup.isOpen ? "gray-background" : "no-background"}`} iconPosition="after" icon={<ChevronDownIcon />} text />}
				content={<PopupMenuCheckboxesContent showSearchBar={props.showSearchBar!} content={{ checkboxes: props.checkboxes, title: props.title }} onCheckboxStateChange={props.onCheckboxStateChange} />}
				trapFocus
			/>
		);
	}
	else if (props.radioGroup) {
		return (
			<Popup
				open={popup.isOpen}
				align="end"
				position="below"
                onOpenChange={(e, { open }: any) => onOpenChange({ isOpen: open })}
				trigger={<Button icon={<ChevronDownIcon />} className={`${popup.isOpen ? "gray-background" : "no-background"}`} iconPosition="after" content={props.title} text />}
				content={<PopupMenuRadiogroupContent selectedValue={props.selectedSortBy!} content={{ radioGroupItems: props.radioGroup, title: props.title }} onRadiogroupStateChange={props.onRadiogroupStateChange} />}
				trapFocus
			/>
		);
	}
	else {
		return (<></>);
	}
}

export default React.memo(PopupMenuWrapper);