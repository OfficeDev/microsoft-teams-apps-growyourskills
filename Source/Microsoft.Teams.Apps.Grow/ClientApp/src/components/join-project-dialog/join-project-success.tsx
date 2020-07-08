// <copyright file="join-project-success.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { Text } from "@fluentui/react-northstar";
import { AcceptIcon } from "@fluentui/react-icons-northstar";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import "../../styles/join-project-taskmodule-view.css";

interface IErrorPageProps extends WithTranslation, RouteComponentProps {
}

class ErrorPage extends React.Component<IErrorPageProps, {}> {
    localize: TFunction;
    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {

        return (
            <div className="container-div">
                <div className="container-subdiv">
                    <div className="success-message">
                        <div className="success-accept-icon"> <AcceptIcon className="accept-icon" /> </div>
                        <Text content={this.localize("joinProjectSuccessMessage")} size="medium" />
                    </div>
                </div>
            </div>
        );
    }
}

export default withTranslation()(ErrorPage)