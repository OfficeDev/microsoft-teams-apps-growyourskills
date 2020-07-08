// <copyright file="no-tag-found.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";

interface INoSkillFoundProps extends WithTranslation {
    node: any;
    closeNoSkillFoundBox: () => void;
}

class NoSkillFound extends React.Component<INoSkillFoundProps> {
    localize: TFunction;
    constructor(props: INoSkillFoundProps) {
        super(props);
        this.localize = this.props.t;
    }

    /**
     * add event listener for clicks
     */
    componentWillMount() {
        document.addEventListener('click', this.handleClick, false);
    }

    /**
     * remove the listener when the component is destroyed.
     */
    componentWillUnmount() {
        document.removeEventListener('click', this.handleClick, false);
    }


    /**
     * the click outside your component.
     */
    handleClick = (event) => {

        if (!this.props.node.contains(event.target)) {
            this.props.closeNoSkillFoundBox();
        }
    }

    /**
     * Renders the component.
     */
    public render(): JSX.Element {
        return (
            <div className="no-tag-found-config">
                {this.localize("noTagFoundError")}
            </div>
        )
    }
}

export default withTranslation()(NoSkillFound)
