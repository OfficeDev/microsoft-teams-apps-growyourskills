// <copyright file="redirect.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Loader } from "@fluentui/react-northstar";

class Redirect extends React.Component<{}, {}> {

    constructor(props: any) {
        super(props);

        let expression = /^http(s)?:\/\/(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
        let regex = new RegExp(expression);
        let pathName = window.location.pathname.charAt(0) === "/" ? window.location.pathname.substr(1) : window.location.pathname;
        if (pathName.match(regex)) {
            window.location.href = pathName;
        }
        else {
            window.location.href = "/error";
        }

    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        return (
            <div className="container-div">
                <div className="container-subdiv">
                    <Loader />
                </div>
            </div>
        );
    }
}

export default Redirect;