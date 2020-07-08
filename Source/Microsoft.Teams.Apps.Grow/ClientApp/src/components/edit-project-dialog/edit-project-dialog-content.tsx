// <copyright file="edit-project-dialog-content.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from "react";
import { Button, Flex, Text, Input, TextArea, Dropdown, ItemLayout, Image, Provider, Label } from "@fluentui/react-northstar";
import { CloseIcon, AddIcon, InfoIcon } from "@fluentui/react-icons-northstar";
import * as microsoftTeams from "@microsoft/teams-js";
import DocumentUrl from "../new-project-dialog/document-url";
import StartDateEndDate from "../new-project-dialog/date-picker";
import { IProjectDetails } from '../card-view/discover-wrapper-page';
import { ISkillValidationParameters } from '../new-project-dialog/new-project-dialog-content';
import { updateProjectContent } from "../../api/discover-api";
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { IPostType } from "../../constants/resources";
import { getLocalizedPostTypes } from "../../helpers/helper";
import Resources from "../../constants/resources";

import "../../styles/new-project-dialog.css";

interface IEditProjectDialogContentProps extends WithTranslation {
    projectDetails: IProjectDetails;
    onSubmit: (getSubmittedPost: IProjectDetails, isSuccess: boolean) => void;
    changeDialogOpenState: (isOpen: boolean) => void;
    allProjectDetails: Array<IProjectDetails>;
}

interface IEditProjectDialogContentState {
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
    linkText: string,
    teamMember: string,
    teamMemberCount: number;
    teamSizeText: string,
    isSubmitClicked: boolean;
    minSkillSelected: boolean;
    isTitleExist: boolean;
    isDateValid: boolean;
    isUrlExist: boolean;
    projectStatus: Array<IPostType>;
    showCalendar: boolean;
    theme: string;
    screenWidth: number;
}

export interface ICalendarButtonExampleProps {
    isDayPickerVisible?: boolean;
    isMonthPickerVisible?: boolean;
    highlightCurrentMonth?: boolean;
    highlightSelectedMonth?: boolean;
    buttonString?: string;
    showMonthPickerAsOverlay?: boolean;
    showGoToToday?: boolean;
}

class EditProjectDialogContent extends React.Component<IEditProjectDialogContentProps, IEditProjectDialogContentState> {
    localize: TFunction;
    teamId = "";
    constructor(props: any) {
        super(props);

        this.localize = this.props.t;
        let localizedPostTypes = getLocalizedPostTypes(this.localize);
        this.state = {
            theme: "",
            screenWidth: window.innerWidth,
            skillList: [],
            documentUrlList: [],
            projectDetails: { ...this.props.projectDetails },
            skill: "",
            isEditDialogOpen: false,
            isTitleValid: true,
            isTypeValid: true,
            isTeamSizeValid: true,
            isDescriptionValid: true,
            isLinkValid: true,
            showCalendar: false,
            isUrlListValid: true,
            skillValidation: { isEmpty: false, isExisting: false, isLengthValid: true, isMaxSkillSelected: false, isMinSkillSelected: false, isSkillContainsSpecialChar: false },
            isLoading: false,
            linkText: "",
            teamMember: "",
            teamMemberCount: 0,
            minSkillSelected: true,
            isTitleExist: false,
            isSubmitClicked: false,
            isDateValid: true,
            isUrlExist: false,
            teamSizeText: this.props.projectDetails.teamSize.toString(),
            projectStatus: localizedPostTypes
        }
    }

    componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context: microsoftTeams.Context) => {
            this.teamId = context.teamId!;
            this.setState({ theme: context.theme! })
        });

        if (this.state.projectDetails.supportDocuments === "") {
            this.setState({
                skillList: this.state.projectDetails.requiredSkills.split(";"),
                documentUrlList: []
            });
        }
        else {
            this.setState({
                skillList: this.state.projectDetails.requiredSkills.split(";"),
                documentUrlList: this.state.projectDetails.supportDocuments.split(";")
            });
        }

        let participantDetails = this.props.projectDetails.projectParticipantsUserMapping.split(';');
        let participant: Array<string> = [];
        let participantName = "";
        if (this.props.projectDetails.projectParticipantsUserMapping !== "" && participantDetails.length) {
            participantDetails.map((value, index) => {
                participant = value.split(':');
                if (index === participantDetails.length - 1) {
                    participantName = participantName + participant[1];
                }
                else {
                    participantName = participantName + participant[1] + ";";
                }
            });

            this.setState({
                teamMember: participantName,
                teamMemberCount: participantName.split(';').length
            });
        }
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
        if (this.checkIfSubmitAllowed()) {
            this.setState({
                isLoading: true
            });

            let projectDetails = this.state.projectDetails;
            projectDetails.requiredSkills = this.state.skillList.join(";");
            projectDetails.supportDocuments = this.state.documentUrlList.join(";");
            projectDetails.teamSize = parseInt(this.state.teamSizeText);

            if (this.state.teamMember === "") {
                projectDetails.projectParticipantsUserMapping = "";
                projectDetails.projectParticipantsUserIds = "";
            }
            else {
                if (this.state.teamMember.split(';').length !== this.state.teamMemberCount) {

                    let getMember = "";
                    projectDetails.projectParticipantsUserMapping.split(';').map((value, index) => {
                        this.state.teamMember.split(';').map((memberValue, memberIndex) => {
                            if (value.indexOf(memberValue) > 0) {
                                if (index === projectDetails.projectParticipantsUserMapping.split(';').length - 1) {
                                    getMember = getMember + value.split(':')[0] + ":" + memberValue;
                                }
                                else {
                                    getMember = getMember + value.split(':')[0] + ":" + memberValue + ";";
                                }
                            }
                        });
                    });

                    if (getMember.charAt(getMember.length - 1) === ';') {
                        projectDetails.projectParticipantsUserMapping = getMember.substring(0, getMember.length - 1);
                    }
                    else {
                        projectDetails.projectParticipantsUserMapping = getMember.substring(0, getMember.length);
                    }

                    let getMemberId = "";
                    if (projectDetails.projectParticipantsUserMapping.indexOf(';') > 0) {
                        projectDetails.projectParticipantsUserMapping.split(';').map((value, index) => {
                            projectDetails.projectParticipantsUserIds.split(';').map((memberValue, memberIndex) => {
                                if (value.includes(memberValue)) {
                                    if (index === projectDetails.projectParticipantsUserMapping.split(';').length - 1) {
                                        getMemberId = getMemberId + memberValue;
                                    }
                                    else {
                                        getMemberId = getMemberId + memberValue + ";";
                                    }
                                }
                            });
                        });
                    }
                    else {
                        projectDetails.projectParticipantsUserIds.split(';').map((memberId, memberIndex) => {
                            if (projectDetails.projectParticipantsUserMapping.includes(memberId)) {
                                getMemberId = getMemberId + memberId;
                            }
                        });
                    }

                    if (getMemberId.charAt(getMemberId.length - 1) === ';') {
                        projectDetails.projectParticipantsUserIds = getMemberId.substring(0, getMemberId.length - 1);
                    }
                    else {
                        projectDetails.projectParticipantsUserIds = getMemberId.substring(0, getMemberId.length);
                    }
                }
            }

            let response = await updateProjectContent(projectDetails);

            if (response.status === 200 && response.data) {
                if (response.data !== false) {
                    this.props.onSubmit(projectDetails, true);
                    this.props.changeDialogOpenState(false);
                }
            }
            else {
                this.props.onSubmit(response.data, false);
            }

            this.setState({
                isLoading: false
            });
        }
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
            this.props.allProjectDetails.map((projects) => {
                if (projects.title.trim().toLowerCase().localeCompare(this.state.projectDetails.title.trim().toLowerCase()) === 0 && projects.projectId !== this.state.projectDetails.projectId) {
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
   *Sets status state.
   *@param status status string
   */
    onStatusChange = (status: string) => {
        const projectStatus: Array<IPostType> = getLocalizedPostTypes(this.localize);
        const changedStatus = projectStatus.filter((value) => {
            if (value.name === status) {
                return value;
            }
        });
        let projectDetails = this.state.projectDetails;
        projectDetails.status = parseInt(changedStatus[0].id);
        this.setState({ projectDetails: projectDetails });
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
	*@param skill Tag string
	*/
    onSkillChange = (skill: string) => {
        this.setState({ skill: skill })
    }

	/**
	*Sets state of skillList by adding new skill.
	*/
    onSkillAddClick = () => {
        if (this.checkIfSkillIsValid()) {

            this.setState((prevState: IEditProjectDialogContentState) => ({ skillList: [...prevState.skillList, this.state.skill.toLowerCase()], skill: "" }));
            if (this.state.skillList.length >= 2) {
                this.setState({
                    minSkillSelected: true
                })
            }
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
                this.setState((prevState: IEditProjectDialogContentState) => ({ documentUrlList: [...prevState.documentUrlList, this.state.linkText.toLowerCase()], linkText: "" }));
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
	*Check if skill is valid
	*/
    checkIfSkillIsValid = () => {
        let validationParams: ISkillValidationParameters = { isEmpty: false, isLengthValid: true, isExisting: false, isMaxSkillSelected: false, isMinSkillSelected: false, isSkillContainsSpecialChar: false };
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
            || this.state.skill.split('"').length > 1) {
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
	*Sets state of skillsList by removing skill using its index.
	*@param index Index of team member to be deleted.
	*/
    onTeamMemberRemoveClick = (index: number) => {
        let teamMember = this.state.teamMember.split(";");
        teamMember.splice(index, 1);
        this.setState({ teamMember: teamMember.join(";") });
    }

	/**
	* Checks whether all validation conditions are matched before user submits edited post content
	*/
    checkIfSubmitAllowed = () => {
        let projectValidationStatus = { isTitleValid: true, isDescriptionValid: true, isUrlListValid: true, isTeamSizeValid: true, isDateValid: true};

        this.props.allProjectDetails.map((projects) => {
            if (projects.title.trim().toLowerCase().localeCompare(this.state.projectDetails.title.trim().toLowerCase()) === 0 && projects.projectId !== this.state.projectDetails.projectId) {
                projectValidationStatus.isTitleValid = false;
                this.setState({
                    isTitleExist: true
                })
            }
        })

        if (this.state.projectDetails.title.trim() === "" || this.state.projectDetails.title.length > Resources.projectTitleMaxLength) {
            projectValidationStatus.isTitleValid = false;
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

        if (this.state.projectDetails.description.trim() === "" ||
            this.state.projectDetails.description.length > Resources.projectDescriptionMaxLength ||
            this.state.projectDetails.description.length < Resources.projectDescriptionMinLength) {
            projectValidationStatus.isDescriptionValid = false;
        }

        if (new Date(this.state.projectDetails.projectStartDate) > new Date() && this.state.projectDetails.projectEndDate === "") {
            projectValidationStatus.isDateValid = false;
        }

        if (parseInt(this.state.teamSizeText) <= 0 ||
            parseInt(this.state.teamSizeText) > 20 ||
            this.state.teamSizeText === "" ||
            this.state.teamMember.split(';').filter((member) => member).length > parseInt(this.state.teamSizeText)) {
            projectValidationStatus.isTeamSizeValid = false;
        }
        else {
            let expression = "^[0-9]*$";
            let regex = new RegExp(expression);
            if (this.state.teamSizeText.match(regex)) {
                projectValidationStatus.isTeamSizeValid = true;
            }
            else {
                projectValidationStatus.isTeamSizeValid = false;
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
            else if (this.state.teamMember.split(';').length > parseInt(this.state.teamSizeText)) {
                return (<Text content={this.localize("teamSizeLessThanParticipant")} className="field-error-message" error size="medium" />);
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

        let membersJoined = 0;
        if (this.state.projectDetails.projectParticipantsUserIds !== "") {
            membersJoined = this.state.projectDetails.projectParticipantsUserIds.split(';').length
        }

        const onTypeSelection = {
            onAdd: item => {
                this.setState((prevState: IEditProjectDialogContentState) => ({
                    projectDetails: { ...prevState.projectDetails, status: parseInt(item.key) }
                }));
                return "";
            },
        };
        const projectStatus: Array<IPostType> = getLocalizedPostTypes(this.localize);

        const postType = projectStatus.filter((value) => {
            if (value.id === this.state.projectDetails.status.toString()) {
                return value;
            }
        });

        const projectStatusList = this.state.projectStatus.map((value: IPostType, index: number) => {
            return { key: value.id, header: value.name }
        })
        projectStatusList.pop();

        return (
            <Provider className="dialog-provider-wrapper">
                <Flex>
                    <Flex.Item grow>
                        <ItemLayout
                            className="app-name-container"
                            media={<Image className="app-logo-container" src="/Artifacts/applicationLogo.png" />}
                            header={<Text content={this.localize("dialogTitleGrowAppName")} weight="bold" />}
                            content={<Text content={this.localize("editProject")} weight="semibold" size="small" />}
                        />
                    </Flex.Item>
                    <CloseIcon className="icon-hover" onClick={() => this.closeDialog()} />
                </Flex>
                <Flex>
                    <div className="dialog-body">
                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                            <Text className="form-label" content={"*" + this.localize("newProjectTitleLabel")} /><InfoIcon className="info-icon" outline size="small" title={this.localize("newProjectTitleLabel")} />
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
                            <Text className="form-label" content={"*" + this.localize("newProjectDescriptionLabel")} /><InfoIcon className="info-icon" outline size="small" title={this.localize("newProjectDescriptionLabel")} />
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
                                <StartDateEndDate
                                    screenWidth={this.state.screenWidth}
                                    theme={this.state.theme}
                                    startDate={new Date(this.state.projectDetails.projectStartDate)}
                                    endDate={new Date(this.state.projectDetails.projectEndDate)}
                                    getStartDate={this.getStartDate}
                                    getEndDate={this.getEndDate}
                                />
                            </Flex.Item>
                        </Flex>


                        <Flex gap="gap.small">
                            <div className="edit-project-half-field">
                                <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                                    <Text className="form-label" content={"*" + this.localize("projectStatus")} /><InfoIcon className="info-icon" outline size="small" title={this.localize("projectStatus")} />
                                </Flex>
                                <Flex gap="gap.smaller" className="input-label-space-between edit-team-size-space">
                                    <Flex.Item>
                                        <Dropdown
                                            placeholder={this.localize("projectStatusPlaceholder")} fluid
                                            value={postType[0].name}
                                            items={projectStatusList}
                                            getA11ySelectionMessage={onTypeSelection}
                                        />
                                    </Flex.Item>
                                </Flex>
                            </div>
                            <div className="edit-project-half-field">
                                <Flex gap="gap.smaller" className="input-fields-margin-between-add-post team-size-error">
                                    <Text className="form-label" content={"*" + this.localize("teamSizeLabel")} /><InfoIcon className="info-icon" outline size="small" title={this.localize("teamSizePlaceholder")} />
                                    <Flex.Item size="size.half" push>
                                        {this.getTeamSizeError()}
                                    </Flex.Item>
                                </Flex>
                                <Flex gap="gap.smaller" className="input-label-space-between edit-team-size-space">
                                    <Flex.Item>
                                        <Input placeholder={this.localize("teamSizePlaceholder")} fluid value={this.state.teamSizeText} onChange={(event: any) => this.onTeamSizeChange(event.target.value)} />
                                    </Flex.Item>
                                </Flex>
                            </div>
                        </Flex>


                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                            <Text className="form-label" content={"*" + this.localize("skillsFormLabel")} /><InfoIcon className="info-icon" outline size="small" title={this.localize("skillsFormLabel")} />
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
                                                styles={{padding:"1rem"}}
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
                            <Text className="form-label" content={this.localize("docLinkFormLabel")} /><InfoIcon className="info-icon" outline size="small" title={this.localize("docLinkFormLabel")} />
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
                        <Flex gap="gap.smaller" className="input-fields-margin-between-add-post">
                            <Text className="form-label" content={this.localize("teamMemberLabel") + " (" + membersJoined + "/" + this.state.projectDetails.teamSize + ")"} />
                            <InfoIcon className="info-icon" outline size="small" title={this.localize("docLinkFormLabel")} />
                        </Flex>
                        <Flex gap="gap.smaller" className="document-url-flex" vAlign="center">
                            <div>
                                {
                                    this.state.teamMember.split(";").map((value: string, index) => {
                                        if (value.trim().length > 0) {
                                            return <Label
                                                styles={{ padding: "1rem" }}
                                                circular
                                                content={<Text className="tag-text-form" content={value.trim()} title={value.trim()} size="small" />}
                                                className={this.state.theme === Resources.dark ? "tags-label-wrapper-dark" : "tags-label-wrapper"}
                                                icon={<CloseIcon key={index} className="icon-hover" onClick={() => this.onTeamMemberRemoveClick(index)} />}
                                            />
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
                            <Button content={this.localize("update")} primary loading={this.state.isLoading} disabled={this.state.isLoading} onClick={this.onSubmitClick} />
                        </Flex.Item>
                    </Flex>
                </Flex>
            </Provider>
        );
    }
}

export default withTranslation()(EditProjectDialogContent)