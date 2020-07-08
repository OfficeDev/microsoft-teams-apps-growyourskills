// <copyright file="new-project-dialog-content.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Button, Flex, Text, Input, TextArea, ItemLayout, Image, Provider, Label } from "@fluentui/react-northstar";
import { CloseIcon, AddIcon, InfoIcon } from "@fluentui/react-icons-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import DocumentUrl from "./document-url";
import StartDateEndDate from "./date-picker";
import { addNewProjectContent } from "../../api/discover-api";
import { IProjectDetails } from '../card-view/discover-wrapper-page';
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import Resources from "../../constants/resources";

import "../../styles/new-project-dialog.css";
import moment from "moment";

interface INewProjectDialogContentProps extends WithTranslation {
    onSubmit: (isSuccess: boolean, getSubmittedPost: IProjectDetails) => void;
    changeDialogOpenState: (isOpen: boolean) => void;
    projectDetails: Array<IProjectDetails>;
}

export interface ISkillValidationParameters {
    isEmpty: boolean;
    isExisting: boolean;
    isLengthValid: boolean;
    isMaxSkillSelected: boolean;
    isMinSkillSelected: boolean;
    isSkillContainsSpecialChar: boolean;
}

interface INewProjectDialogContentState {
    projectDetails: IProjectDetails;
    skillList: Array<string>;
    documentUrlList: Array<string>;
    skill: string;
    isEditDialogOpen: boolean;
    isTitleValid: boolean;
    isDescriptionValid: boolean;
    isTypeValid: boolean;
    isLinkValid: boolean;
    isTeamSizeValid: boolean;
    isUrlListValid: boolean;
    isLoading: boolean;
    skillValidation: ISkillValidationParameters;
    linkText: string;
    teamSizeText: string;
    isSubmitClicked: boolean;
    minSkillSelected: boolean;
    isTitleExist: boolean;
    isDateValid: boolean;
    isUrlExist: boolean;
    projectStatus: Array<string>;
    theme: string;
    screenWidth: number;
}

class NewProjectDialogContent extends React.Component<INewProjectDialogContentProps, INewProjectDialogContentState> {
    localize: TFunction;
    teamId = "";
    constructor(props: any) {
        super(props);
        window.addEventListener("resize", this.update);
        this.localize = this.props.t;
        this.state = {
            theme: "",
            skillList: [],
            screenWidth: window.innerWidth,
            documentUrlList: [],
            projectDetails: {
                supportDocuments: "",
                createdByName: "",
                createdDate: new Date(),
                description: "",
                projectId: "",
                requiredSkills: "",
                title: "",
                teamSize: 0,
                projectStartDate: moment().toISOString(),
                projectEndDate: moment().add(1, 'days').toISOString(),
                status: 1,
                updatedDate: new Date(),
                createdByUserId: "",
                isJoinedByUser: undefined,
                isRemoved: false,
                avatarBackgroundColor: "#ffffff",
                projectParticipantsUserMapping: "",
                projectParticipantsUserIds: ""
            },
            skill: "",
            isEditDialogOpen: false,
            isTitleValid: true,
            isTypeValid: true,
            isTeamSizeValid: true,
            isDescriptionValid: true,
            isLinkValid: true,
            isDateValid: true,
            isUrlListValid: true,
            isSubmitClicked: false,
            skillValidation: { isEmpty: false, isExisting: false, isLengthValid: true, isMaxSkillSelected: false, isMinSkillSelected: false, isSkillContainsSpecialChar: false },
            isLoading: false,
            minSkillSelected: true,
            isTitleExist: false,
            isUrlExist: false,
            linkText: "",
            teamSizeText: "",
            projectStatus: ["Not started", "new", "active"]
        }
    }

    componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.teamId = context.teamId!;
            this.setState({ theme: context.theme! })
        });
    }

    /**
    * get screen width real time
    */
    update = () => {
        this.setState({
            screenWidth: window.innerWidth
        });
    };

	/**
	*Close the dialog and pass back card properties to parent component.
	*/
    onSubmitClick = async () => {
        this.setState({ isSubmitClicked: true })
        if (this.checkIfSubmitAllowed()) {
            this.setState({
                isLoading: true
            });

            let projectDetails = this.state.projectDetails;
            projectDetails.requiredSkills = this.state.skillList.join(";");
            projectDetails.supportDocuments = this.state.documentUrlList.join(";");
            projectDetails.teamSize = parseInt(this.state.teamSizeText);

            if (projectDetails.projectStartDate === "") {
                projectDetails.projectStartDate = new Date().toUTCString();
            }

            if (projectDetails.projectEndDate === "") {
                projectDetails.projectEndDate = new Date().toUTCString();
            }

            let response = await addNewProjectContent(projectDetails);

            if (response.status === 200 && response.data) {
                if (response.data !== false) {
                    this.props.onSubmit(true, response.data);
                    this.props.changeDialogOpenState(false);
                }
            }
            else {
                this.props.onSubmit(false, response.data);
            }

            this.setState({
                isLoading: false
            });
        }
    }

    /**
    *Reset add new project form.
    */
    resetForm = () => {
        this.setState({
            linkText: "",
            skill: "",
            teamSizeText: "",

        })

        let projectDetails = this.state.projectDetails;
        projectDetails.title = "";
        projectDetails.description = "";
        projectDetails.projectStartDate = new Date().toUTCString();
        projectDetails.projectEndDate = new Date().toUTCString();

        this.setState({
            projectDetails: projectDetails
        })
    }

	/**
	*Sets description state.
	*@param description Description string
	*/
    onDescriptionChange = (description: string) => {
        let cardDetails = this.state.projectDetails;
        cardDetails.description = description;
        this.setState({ projectDetails: cardDetails, isDescriptionValid: true });
    }

	/**
	*Sets heading state.
	*@param headingText Heading string
	*/
    onHeadingChange = (headingText: string) => {
        let cardDetails = this.state.projectDetails;
        cardDetails.title = headingText;
        this.setState({ projectDetails: cardDetails, isTitleValid: true });
        let titleCheck = 0;
        if (this.state.isTitleExist === true) {
            this.props.projectDetails.map((projects) => {
                if (projects.title.trim().toLowerCase().localeCompare(this.state.projectDetails.title.trim().toLowerCase()) === 0) {
                    this.setState({
                        isTitleExist: true
                    })
                    titleCheck++;
                }
            })
        }
        if (titleCheck === 0) {
            this.setState({
                isTitleExist: false
            })
        }
    }

    /**
	*Sets team size state.
	*@param teamSize team size string
	*/
    onTeamSizeChange = (teamSize: string) => {
        this.setState({ teamSizeText: teamSize });
    }

	/**
	*Sets link state.
	*@param link Link string
	*/
    onLinkChange = (link: string) => {
        this.setState({ linkText: link });
    }

	/**
	*Sets skill state.
	*@param skill skill string
	*/
    onSkillChange = (skill: string) => {
        let skillValidation = this.state.skillValidation
        skillValidation.isMaxSkillSelected = false;
        this.setState({
            skillValidation: skillValidation, skill: skill
        });
    }

	/**
	*Sets state of skillsList by adding new skill.
	*/
    onSkillAddClick = () => {
        if (this.checkIfSkillIsValid()) {
            if (this.state.skillList.length >= 2) {
                this.setState({
                    minSkillSelected: true
                })
            }
            this.setState((prevState: INewProjectDialogContentState) => ({ skillList: [...prevState.skillList, this.state.skill.toLowerCase()], skill: "" }));
        }
    }

    /**
	*Sets state of document Url List by adding new Url.
	*/
    onLinkAddClick = () => {
        let linkValidationStatus = { isLinkValid: false };
        let urls = this.state.documentUrlList;
        let isLinkExist = urls.find((url: string) => {
            if (url.toLowerCase() === this.state.linkText.toLowerCase()) {
                this.setState({
                    isUrlExist: true
                })
                return url;
            }
        });
        if (this.state.linkText.trim() === "" || this.state.linkText.length > Resources.projectContentUrlMaxLength || this.state.documentUrlList.length >= 3 || isLinkExist) {
            linkValidationStatus.isLinkValid = false;
            this.setState({
                isUrlListValid: false
            });
        }
        else {
            let expression = Resources.projectUrlValidationRegEx;
            let regex = new RegExp(expression);
            if (this.state.linkText.match(regex)) {
                linkValidationStatus.isLinkValid = true;
                this.setState((prevState: INewProjectDialogContentState) => ({ documentUrlList: [...prevState.documentUrlList, this.state.linkText.toLowerCase()], linkText: "" }));
                this.setState({
                    isUrlListValid: true
                })
            }
            else {
                linkValidationStatus.isLinkValid = false;
                this.setState({
                    isUrlListValid: false
                })

            }
        }
        this.setState({
            isLinkValid: linkValidationStatus.isLinkValid
        })

    }

	/**
	*Check if tag is valid
	*/
    checkIfSkillIsValid = () => {
        let validationParams: ISkillValidationParameters = { isEmpty: false, isLengthValid: true, isExisting: false, isMaxSkillSelected: false, isMinSkillSelected: true, isSkillContainsSpecialChar: false  };
        if (this.state.skill.trim() === "") {
            validationParams.isEmpty = true;
        }

        if (this.state.skill.length > Resources.skillMaxLength) {
            validationParams.isLengthValid = false;
        }

        let skills = this.state.skillList;
        let isTagExist = skills.find((skill: string) => {
            if (skill.toLowerCase() === this.state.skill.toLowerCase()) {
                return skill;
            }
        });

        if (this.state.skill.split(";").length > 1
            || this.state.skill.split('|').length > 1
            || this.state.skill.split('(').length > 1
            || this.state.skill.split(')').length > 1
            || this.state.skill.split('\'').length > 1
            || this.state.skill.split('\\').length > 1
            || this.state.skill.split('"').length > 1)
        {
            validationParams.isSkillContainsSpecialChar = true;
        }

        if (isTagExist) {
            validationParams.isExisting = true;
        }

        if (this.state.skillList.length >= 5) {
            validationParams.isMaxSkillSelected = true;
        }

        this.setState({ skillValidation: validationParams });

        if (!validationParams.isEmpty && !validationParams.isExisting && validationParams.isLengthValid && !validationParams.isMaxSkillSelected && !validationParams.isSkillContainsSpecialChar) {
            return true;
        }
        return false;
    }

	/**
	*Sets state of skillsList by removing skill using its index.
	*@param index Index of skill to be deleted.
	*/
    onSkillRemoveClick = (index: number) => {
        let skills = this.state.skillList;
        skills.splice(index, 1);
        this.setState({ skillList: skills });
        let skillValidation = this.state.skillValidation
        skillValidation.isMaxSkillSelected = false;
        this.setState({
            skillValidation: skillValidation
        });
    }

    /**
	*Sets state of skillsList by removing skill using its index.
	*@param index Index of skill to be deleted.
	*/
    onLinkRemoveClick = (index: number) => {
        let link = this.state.documentUrlList;
        link.splice(index, 1);
        this.setState({ documentUrlList: link });
    }

	/**
	* Checks whether all validation conditions are matched before user submits edited post content
	*/
    checkIfSubmitAllowed = () => {
        let projectValidationStatus = { isTitleValid: true, isDescriptionValid: true, isUrlListValid: true, isTeamSizeValid: true, isDateValid: true };

        this.props.projectDetails.map((projects) => {
            if (projects.title.trim().toLowerCase().localeCompare(this.state.projectDetails.title.trim().toLowerCase()) === 0) {
                projectValidationStatus.isTitleValid = false;
                this.setState({
                    isTitleExist: true
                })
            }
        })

        if (this.state.projectDetails.title.trim() === "" || this.state.projectDetails.title.length > Resources.projectTitleMaxLength) {
            projectValidationStatus.isTitleValid = false;
        }

        if (this.state.projectDetails.description.trim() === "" ||
            this.state.projectDetails.description.length > Resources.projectDescriptionMaxLength ||
            this.state.projectDetails.description.length < Resources.projectDescriptionMinLength) {
            projectValidationStatus.isDescriptionValid = false;
        }

        let expression = "^[0-9]*$";
        let regex = new RegExp(expression);
        if (this.state.teamSizeText.match(regex)) {
            if (parseInt(this.state.teamSizeText) <= 0 || parseInt(this.state.teamSizeText) > 20 || this.state.teamSizeText === "") {
                projectValidationStatus.isTeamSizeValid = false;
            }
            else {
                projectValidationStatus.isTeamSizeValid = true;
            }
        }
        else {
            projectValidationStatus.isTeamSizeValid = false;
        }

        if (this.state.projectDetails.projectEndDate === "") {
            if (new Date(this.state.projectDetails.projectStartDate) > new Date()) {
                projectValidationStatus.isDateValid = false;
            }
        }
        else {
            if (new Date(this.state.projectDetails.projectStartDate) > new Date(this.state.projectDetails.projectEndDate)) {
                projectValidationStatus.isDateValid = false;
            }
        }



        if (this.state.skillList.length < 2) {
            let isSkillValid = this.state.skillValidation;
            isSkillValid.isEmpty = true;
            this.setState({ minSkillSelected: false });
            this.setState({ skillValidation: isSkillValid });
        }

        this.setState({
            isUrlListValid: projectValidationStatus.isUrlListValid,
            isDescriptionValid: projectValidationStatus.isDescriptionValid,
            isTitleValid: projectValidationStatus.isTitleValid,
            isTeamSizeValid: projectValidationStatus.isTeamSizeValid,
            isDateValid: projectValidationStatus.isDateValid
        });
        if (projectValidationStatus.isTitleValid && projectValidationStatus.isDescriptionValid && projectValidationStatus.isUrlListValid && projectValidationStatus.isTeamSizeValid && !this.state.skillValidation.isEmpty && projectValidationStatus.isDateValid) {
            return true;
        }
        else {
            return false;
        }
    }

	/**
    *Returns text component containing error message for failed title field validation
    */
    private getTitleError = () => {
        if (!this.state.isTitleValid) {
            if (this.state.projectDetails.title.trim() === "") {
                return (<Text content={this.localize("emptyTitleError")} className="field-error-message" error size="medium" />);
            }
            if (this.state.projectDetails.title.length > Resources.projectTitleMaxLength) {
                return (<Text content={this.localize("maxCharactersTitleError")} className="field-error-message" error size="medium" />);
            }
            if (this.state.isTitleExist) {
                return (<Text content={this.localize("titleExistError")} className="field-error-message" error size="medium" />);
            }
        }
        return (<></>);
    }

    /**
    *Returns text component containing error message for failed team size field validation
    */
    private getTeamSizeError = () => {
        if (!this.state.isTeamSizeValid) {
            let expression = "^[0-9]*$";
            let regex = new RegExp(expression)
            if (parseInt(this.state.teamSizeText) <= 0) {
                return (<Text content={this.localize("minTeamSizeError")} className="field-error-message" error size="medium" />);
            }
            else if (!this.state.teamSizeText.toString().match(regex)) {
                return (<Text content={this.localize("teamSizeNumberError")} className="field-error-message" error size="medium" />);
            }
            else if (parseInt(this.state.teamSizeText) > 20) {
                return (<Text content={this.localize("maxTeamSizeError")} className="field-error-message" error size="medium" />);
            }
            else if (this.state.teamSizeText === "") {
                return (<Text content={this.localize("emptyTeamSize")} className="field-error-message" error size="medium" />);
            }
        }
        return (<></>);
    }

	/**
    *Returns text component containing error message for failed description field validation
    */
    private getDescriptionError = () => {
        if (!this.state.isDescriptionValid) {
            if (this.state.projectDetails.description.trim() === "") {
                return (<Text content={this.localize("emptyDescriptionError")} className="field-error-message" error size="medium" />);
            }

            if (this.state.projectDetails.description.length < Resources.projectDescriptionMinLength) {
                return (<Text content={this.localize("minLengthDescriptionError")} className="field-error-message" error size="medium" />);
            }

            if (this.state.projectDetails.description.length > Resources.projectDescriptionMaxLength) {
                return (<Text content={this.localize("maxCharactersDescriptionError")} className="field-error-message" error size="medium" />);
            }
        }
        return (<></>);
    }

	/**
    *Returns text component containing error message for failed link field validation
    */
    private getLinkError = () => {

        if (!this.state.isUrlListValid) {
            let expression = Resources.projectUrlValidationRegEx;
            let regex = new RegExp(expression);
            if (this.state.linkText.length > Resources.projectContentUrlMaxLength) {
                return (<Text content={this.localize("maxCharacterLinkError")} className="field-error-message" error size="medium" />);
            }
            if (this.state.documentUrlList.length >= 3) {
                return (<Text content={this.localize("maxDocumentLinkError")} className="field-error-message" error size="medium" />);
            }
            if (this.state.isUrlExist) {
                return (<Text content={this.localize("sameLinkError")} className="field-error-message" error size="medium" />);
            }
            if (!this.state.linkText.match(regex)) {
                return (<Text content={this.localize("invalidLinkError")} className="field-error-message" error size="medium" />);
            }
        }
        return (<></>);
    }

	/**
    *Returns text component containing error message for empty tag input field
    */
    private getSkillError = () => {
        if (this.state.skillValidation.isExisting) {
            return (<Text content={this.localize("sameSkillAlreadyExist")} className="field-error-message" error size="medium" />);
        }
        else if (this.state.minSkillSelected === false) {
            return (<Text content={this.localize("minimumSkillsSelected")} className="field-error-message" error size="medium" />);
        }
        else if (!this.state.skillValidation.isLengthValid) {
            return (<Text content={this.localize("skillLengthError")} className="field-error-message" error size="medium" />);
        }
        else if (this.state.skillValidation.isMaxSkillSelected) {
            return (<Text content={this.localize("maxSkillSelected")} className="field-error-message" error size="medium" />);
        }
        else if (this.state.skillList.length === 0 && this.state.isSubmitClicked === true) {
            return (<Text content={this.localize("minimumSkillsSelected")} className="field-error-message" error size="medium" />);
        }
        else if (this.state.skillValidation.isSkillContainsSpecialChar) {
            return (<Text content={this.localize("specialCharSkillError")} className="field-error-message" error size="medium" />);
        }

        return (<></>);
    }

    private getDateError = () => {
        if (this.state.isDateValid === false) {
            return (<Text content={this.localize("dateError")} className="field-error-message" error size="medium" />);
        }
        return (<></>);
    }
	/**
	* Adds tag when enter key is pressed
	* @param event Object containing event details
	*/
    onSkillKeyDown = (event: any) => {
        if (event.key === 'Enter') {
            this.onSkillAddClick();
        }
    }


    /**
	* Adds tag when enter key is pressed
	* @param event Object containing event details
	*/
    onLinkKeyDown = (event: any) => {
        if (event.key === 'Enter') {
            this.onLinkAddClick();
        }
    }

    getStartDate = (startDate: Date) => {
        let projectdetails = this.state.projectDetails;
        projectdetails.projectStartDate = startDate.toUTCString();
        this.setState({ projectDetails: projectdetails });
        if (new Date(this.state.projectDetails.projectEndDate) >= new Date(this.state.projectDetails.projectEndDate)) {
            this.setState({
                isDateValid: true
            })
        }
    }

    getEndDate = (endDate: Date) => {
        let projectdetails = this.state.projectDetails;
        projectdetails.projectEndDate = endDate.toUTCString();
        this.setState({ projectDetails: projectdetails });
        if (new Date(this.state.projectDetails.projectEndDate) >= new Date(this.state.projectDetails.projectEndDate)) {
            this.setState({
                isDateValid: true
            })
        }
    }

    closeDialog = () => {

        this.setState({
            isSubmitClicked: false
        })
        this.props.changeDialogOpenState(false)
    }
	/**
	* Renders the component
	*/
    public render(): JSX.Element {


        return (
            <Provider className="dialog-provider-wrapper">
                <Flex>
                    <Flex.Item grow>
                        <ItemLayout
                            className="app-name-container"
                            media={<Image className="app-logo-container" src="/Artifacts/applicationLogo.png" />}
                            header={<Text content={this.localize("dialogTitleGrowAppName")} weight="bold" />}
                            content={<Text content={this.localize("createNewProject")} weight="semibold" size="small" />}
                        />
                    </Flex.Item>
                    <CloseIcon className="icon-hover" onClick={() => this.closeDialog()} />
                </Flex>
                <Flex>
                    <div className="dialog-body">
                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                            <Text className="form-label" content={"*" + this.localize("newProjectTitleLabel")} /><InfoIcon outline className="info-icon" size="small" title={this.localize("newProjectTitleLabel")} />
                            <Flex.Item push>
                                {this.getTitleError()}
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" className="input-label-space-between">
                            <Flex.Item>
                                <Input maxLength={Resources.projectTitleMaxLength} placeholder={this.localize("newProjectTitlePlaceholder")} fluid value={this.state.projectDetails.title} onChange={(event: any) => this.onHeadingChange(event.target.value)} />
                            </Flex.Item>
                        </Flex>

                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                            <Text className="form-label" content={"*" + this.localize("newProjectDescriptionLabel")} /><InfoIcon outline className="info-icon" size="small" title={this.localize("newProjectDescriptionLabel")} />
                            <Flex.Item push>
                                {this.getDescriptionError()}
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" className="text-area input-label-space-between">
                            <Flex.Item>
                                <TextArea maxLength={Resources.projectDescriptionMaxLength} placeholder={this.localize("newProjectDescriptionPlaceholder")} fluid className="text-area" value={this.state.projectDetails.description} onChange={(event: any) => this.onDescriptionChange(event.target.value)} />
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" className="input-label-space-between">
                            <Flex.Item push>
                                {this.getDateError()}
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" className="input-label-space-between date-picker-size-space">
                            <Flex.Item>
                                {
                                    <StartDateEndDate
                                        screenWidth={this.state.screenWidth}
                                        theme={this.state.theme}
                                        startDate={new Date(this.state.projectDetails.projectStartDate)}
                                        endDate={new Date(this.state.projectDetails.projectEndDate)}
                                        getStartDate={this.getStartDate}
                                        getEndDate={this.getEndDate} />
                                }
                            </Flex.Item>
                        </Flex>

                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post team-size-error">
                            <Text className="form-label" content={"*" + this.localize("teamSizeLabel")} /><InfoIcon className="info-icon" outline size="small" title={this.localize("teamSizePlaceholder")} />
                            <Flex.Item push>
                                {this.getTeamSizeError()}
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" className="input-label-space-between team-size-space">
                            <Flex.Item>
                                <Input placeholder={this.localize("teamSizePlaceholder")} fluid value={this.state.teamSizeText} onChange={(event: any) => this.onTeamSizeChange(event.target.value)} />
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                            <Text className="form-label" content={"*" + this.localize("skillsFormLabel")} /><InfoIcon outline className="info-icon" size="small" title={this.localize("skillsFormLabel")} />
                            <Flex.Item push>
                                <div>
                                    {this.getSkillError()}
                                </div>
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" vAlign="center" className="input-label-space-between">
                            <Flex.Item>
                                <Input maxLength={Resources.skillMaxLength} placeholder={this.localize("skillsPlaceholder")} fluid value={this.state.skill} onKeyDown={this.onSkillKeyDown} onChange={(event: any) => this.onSkillChange(event.target.value)} />
                            </Flex.Item>
                            <AddIcon key="search" onClick={this.onSkillAddClick} className="add-icon-url icon-hover" />
                        </Flex>
                        <Flex gap="gap.smaller" className="skills-flex skills-new-project" vAlign="center">
                            <div>
                                {
                                    this.state.skillList.map((value: string, index) => {
                                        if (value.trim().length > 0) {
                                            return <Label
                                                styles={{ padding: "1rem" }}
                                                circular
                                                content={<Text className="tag-text-form" content={value.trim()} title={value.trim()} size="small" />}
                                                className={this.state.theme === Resources.dark ? "tags-label-wrapper-dark" : "tags-label-wrapper"}
                                                icon={<CloseIcon key={index} className="icon-hover" onClick={() => this.onSkillRemoveClick(index)} />}
                                            />
                                        }
                                    })
                                }
                            </div>
                        </Flex>
                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                            <Text className="form-label" content={this.localize("docLinkFormLabel")} /><InfoIcon outline className="info-icon" size="small" title={this.localize("docLinkFormLabel")} />
                            <Flex.Item push>
                                {this.getLinkError()}
                            </Flex.Item>
                        </Flex>
                        <Flex gap="gap.smaller" className="input-label-space-between">
                            <Flex.Item>
                                <Input icon={<AddIcon styles={{ display: "none" }} />} maxLength={Resources.projectContentUrlMaxLength} onKeyDown={this.onLinkKeyDown} value={this.state.linkText} placeholder={this.localize("docLinkPlaceholder")} fluid onChange={(event: any) => this.onLinkChange(event.target.value)} />
                            </Flex.Item>
                            <AddIcon key="search" onClick={this.onLinkAddClick} className="add-icon-url icon-hover" />
                        </Flex>
                        <Flex gap="gap.smaller" className="document-url-flex" vAlign="center">
                            <div>
                                {
                                    this.state.documentUrlList.map((value: string, index) => {
                                        if (value.trim().length > 0) {
                                            return <DocumentUrl showDeleteIcon={true} index={index} urlContent={value.trim()} onRemoveClick={this.onLinkRemoveClick} />
                                        }
                                    })
                                }
                            </div>
                        </Flex>
                    </div>
                </Flex>
                <Flex className="dialog-footer-wrapper">
                    <Flex gap="gap.smaller" className="dialog-footer input-fields-margin-between-add-post">
                        <Flex.Item push>
                            <Button content={this.localize("reset")} disabled={this.state.isLoading} onClick={this.resetForm} />
                        </Flex.Item>
                        <Button content={this.localize("create")} primary loading={this.state.isLoading} disabled={this.state.isLoading} onClick={this.onSubmitClick} />
                    </Flex>
                </Flex>
            </Provider>
        );
    }
}

export default withTranslation()(NewProjectDialogContent)