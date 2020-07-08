// <copyright file="team-config-page.tsx" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

import * as React from 'react';
import * as microsoftTeams from "@microsoft/teams-js";
import { getBaseUrl } from '../configVariables';
import { submitConfiguredSkills, getConfigSkills } from "../api/teams-config-tab-api";
import { filterSkills } from "../api/teams-config-tab-api";
import PreferencesSuggestion from "../components/configure-preference-dialog/preferences-suggestion-list";
import Resources from '../constants/resources';
import Tag from "../components/card-view/tag";
import NoSkillFound from "../components/configure-preference-dialog/no-tag-found"
import { Flex, Text, Input, Loader } from "@fluentui/react-northstar";
import { SearchIcon } from '@fluentui/react-icons-northstar';
import { WithTranslation, withTranslation } from "react-i18next";
import { TFunction } from "i18next";

import "../styles/teams-config-tab.css";

interface ITeamConfigDetailsProps extends WithTranslation {
    teamConfigDetails: ITeamConfigDetails;
    changeDialogOpenState: (isOpen: boolean) => void;
}

interface ITeamConfigDetails {
    skills: string;
    teamId: string;
}

interface ITeamConfigState {
    SkillsList: Array<string>;
    showSuggestion: boolean;
    savedSkillItems: Array<string>;
    showSkillError: boolean;
    searchText: string;
    showNoSkillFound: boolean;
    showEmptyStringError: boolean;
    disableSubmitButton: boolean;
    showLoader: boolean;
    showSuggestionLoader: boolean;
    showNoSkillsMessage: boolean;
    teamConfigDetails: ITeamConfigDetails;
}

class TeamsConfigPage extends React.Component<ITeamConfigDetailsProps, ITeamConfigState> {
    localize: TFunction;
    url = getBaseUrl() + "/discover-team?teamId={teamId}";
    teamId: string;
    nodeConfig: any;
    constructor(props: any) {
        super(props);
        this.localize = this.props.t;
        this.teamId = "";
        this.state = {
            SkillsList: [],
            savedSkillItems: [],
            showSuggestion: false,
            showSkillError: false,
            searchText: "",
            showNoSkillFound: false,
            showEmptyStringError: false,
            disableSubmitButton: false,
            showLoader: false,
            showSuggestionLoader: false,
            showNoSkillsMessage: false,
            teamConfigDetails: { ...this.props.teamConfigDetails }
        }
    }

    /**
    * Used to initialize Microsoft Teams sdk
    */
    public componentDidMount() {
        microsoftTeams.initialize();
        microsoftTeams.getContext(async (context: microsoftTeams.Context) => {
            this.teamId = context.teamId!;
            setTimeout(async () => {
                let response = await getConfigSkills(this.teamId);
                if (response.status === 200 && response.data) {
                    if (response.data.skills === null) {
                        this.setState({
                            SkillsList: [],
                            showNoSkillsMessage: true
                        })
                    }
                    else {
                        this.setState({
                            SkillsList: response.data.skills.split(';').filter((skill) => skill.trim() !== "")
                        })
                    }
                }
            }, 300);
        });

        microsoftTeams.settings.registerOnSaveHandler(async (saveEvent: microsoftTeams.settings.SaveEvent) => {
            this.setState({
                showLoader: true
            })

            let configureDetails = this.state.teamConfigDetails;
            configureDetails.skills = this.state.SkillsList.join(';');
            configureDetails.teamId = this.teamId;

            let response = await submitConfiguredSkills(configureDetails);
            if (response.status === 200 && response.data) {
                this.setState({
                    showLoader: false
                })
                microsoftTeams.settings.setSettings({
                    entityId: "Grow_Bot_App",
                    contentUrl: this.url,
                    suggestedDisplayName: this.localize("All projects"),
                });
                saveEvent.notifySuccess();
            }
            else {
                microsoftTeams.settings.setSettings({
                    entityId: "Grow_Bot_App",
                    contentUrl: this.url,
                    suggestedDisplayName: this.localize("All projects"),
                });
                saveEvent.notifySuccess();
            }

        });

        microsoftTeams.settings.setValidityState(true);

    }

    /**
    * Method to render error if particular skill is already added.
    */
    showSkillsAlreadyAddedError() {
        if (this.state.showSkillError) {
            if (this.state.SkillsList.length === Resources.skillsMaxCountPreferences)
                
            return (
                <Flex gap="gap.smaller" className="tag-error-maxfive-config">
                    <Text content={this.localize("preferenceTagCountError")} />
                </Flex>
            )
            else {
                return (
                    <Flex gap="gap.smaller" className="tag-error-label-config">
                        <Text content={this.localize("tagAlreadyAddedError")} />
                    </Flex>
                )
            }
        }
        else if (this.state.showEmptyStringError) {
            return (
                <Flex gap="gap.smaller" className="tag-error-label-config">
                    <Text content={this.localize("emptyTagFieldError")} />
                </Flex>
            )
        }
        else {
            return (<></>)
        }
    }

    /**
    * Remove selected skill for configuration in a team.
    * @param index Index of the skill which need to be removed.
    */
    onSkillRemoveClick = (index: number) => {
        let skills = this.state.SkillsList;
        skills.splice(index, 1);
        if (this.state.SkillsList.length) {
            this.setState({
                disableSubmitButton: false,
                SkillsList: skills,
                showSkillError: false
            })
        }
        else {
            this.setState({
                disableSubmitButton: true,
                SkillsList: skills,
                showSkillError: false
            })
        }
    }

    /**
    * Method add skills in to skilllist
    * @param value Skill to be added
    */
    onSkillAddClick = (value: string) => {
        const skillList = this.state.SkillsList.slice(0);

        if (this.state.SkillsList.indexOf(value) === -1 && this.state.SkillsList.length < 5) {
            this.setState({
                showSkillError: false
            })
            skillList.push(value.trim());
            this.setState({
                SkillsList: skillList,
                disableSubmitButton: false,
                showNoSkillsMessage: false
            });
        }
        else {
            this.setState({
                showSkillError: true
            })
        }
    }

    /**
    * Method to show loader while submitting preferences details.
    */
    showLoader() {
        if (this.state.showLoader) {
            return (<Loader className="preference-loader" />)
        }
    }

    /**
    * Clear all skills
    */
    closeSuggestionBox = () => {
        this.setState({
            savedSkillItems: [],
            showNoSkillFound: false
        })
    }

    /**
    * Close no skill found box.
    */
    closeNoSkillFoundBox = () => {
        this.setState({
            showNoSkillFound: false
        })
    }

    /**
    * Method render filtered skills in autosuggest dropdown.
    */
    showSuggestedSkills() {
        if (this.state.savedSkillItems.length && this.state.searchText.length) {
            return (
                <PreferencesSuggestion
                    digestFrequency=""
                    node={this.nodeConfig}
                    onTagAddClick={this.onSkillAddClick}
                    savedTagItems={this.state.savedSkillItems}
                    showSuggestion={this.state.showSuggestion}
                    closeSuggestionBox={this.closeSuggestionBox} />
            )
        }
        else {
            if (this.state.showNoSkillFound) {
                return (
                    <NoSkillFound
                        node={this.nodeConfig}
                        closeNoSkillFoundBox={this.closeNoSkillFoundBox} />
                )
            }
            else if (this.state.showSuggestionLoader) {
                return (<div className="suggestion-loader-config">
                    <Loader />
                </div>)
            }
        }
    }

    /**
    * Method to fetch filtered skills based on search text.
    */
    filterSavedSkills = async (searchText: string) => {
        if (this.state.searchText.length === 0) {
            this.setState({
                showEmptyStringError: true
            })
        }
        else {
            this.setState({
                showSuggestionLoader: true
            });
            let response = await filterSkills(searchText);
            if (response.status === 200 && response.data) {
                if (response.data.length) {
                    this.setState({
                        savedSkillItems: response.data
                    })
                }
                else {
                    this.setState({
                        showNoSkillFound: true
                    })
                }
            }
            else {
                this.setState({
                    showNoSkillFound: true
                })
            }
        }
        this.setState({
            showSuggestionLoader: false
        });
    }

    /**
    * Method to get input search text in state
    * @param searchText User entered search text
    */
    getInputValue = (searchText: string) => {
        this.setState({
            searchText: searchText
        })
        if (searchText.length === 0) {
            this.setState({
                savedSkillItems: [],
                showNoSkillFound: false,
            });
        }
        this.setState({
            showSkillError: false,
            showEmptyStringError: false
        })
    }

    /**
    * Enter key Press method to fetch skills in autosuggest
    * @param event Event object for input
    */
    onEnterKeyPress = async (event: any) => {
        if (event.keyCode === Resources.keyCodeEnter) {

            if (this.state.searchText.length === 0) {
                this.setState({
                    showEmptyStringError: true
                })
            }
            else {
                this.setState({
                    showSuggestionLoader: true
                });
                let response = await filterSkills(this.state.searchText);
                if (response.status === 200 && response.data) {
                    if (response.data.length) {
                        this.setState({
                            savedSkillItems: response.data
                        })
                    }
                    else {
                        this.setState({
                            showNoSkillFound: true
                        })
                    }
                }
                else {
                    this.setState({
                        showNoSkillFound: true
                    })
                }
            }
            this.setState({
                showSuggestionLoader: false
            });
        }
    }

    /**
    * Method to show skill list after selecting them from dropdown.
    */
    showSkills() {
        if (this.state.showNoSkillsMessage) {
            return (
                <Text content={this.localize("noTagConfiguredNote")} />
            )
        }
        else {
            return (
                <div>
                    {
                        this.state.SkillsList.map((value: string, index: number) => {
                            return <Tag index={index} tagContent={value.trim()} showRemoveIcon={true} onRemoveClick={this.onSkillRemoveClick} />
                        })
                    }
                </div>
            )
        }
    }

    /**
    * Renders the component
    */
    public render(): JSX.Element {
        return (
            <div className="dialog-container-div-config">
                <div className="config-container" ref={nodeConfig => this.nodeConfig = nodeConfig}>
                    <Flex gap="gap.smaller" className="tag-searchbox-label">
                        <Text content={this.localize("tagsLabel")} />
                        <Flex.Item push>
                            {this.showSkillsAlreadyAddedError()}
                        </Flex.Item>
                    </Flex>
                    <Flex className="search-div">
                        <Input onKeyDown={(event: any) => this.onEnterKeyPress(event)} icon={<SearchIcon onClick={(event: any) => this.filterSavedSkills(this.state.searchText)} key="search" className="search-icon" />} fluid onChange={(event: any) => this.getInputValue(event.target.value)} placeholder={this.localize("searchPlaceholder")} />
                    </Flex>
                    <Flex>
                        {this.showSuggestedSkills()}
                    </Flex>

                    <Flex gap="gap.smaller" className="tags-flex-preferences" vAlign="center">
                        {this.showSkills()}
                    </Flex>
                </div>

            </div>
        );
    }
}

export default withTranslation()(TeamsConfigPage)
