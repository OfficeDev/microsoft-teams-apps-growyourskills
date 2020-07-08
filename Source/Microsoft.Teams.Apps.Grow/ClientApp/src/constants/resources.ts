// <copyright file="resources.ts" company="Microsoft">
// Copyright (c) Microsoft. All rights reserved.
// </copyright>

export interface IPostType {
	name: string;
	id: string;
	color: string;
}

export default class Resources {

	// Themes
	public static readonly body: string = "body";
	public static readonly theme: string = "theme";
	public static readonly default: string = "default";
	public static readonly light: string = "light";
	public static readonly dark: string = "dark";
	public static readonly contrast: string = "contrast";

	// KeyCodes
	public static readonly keyCodeEnter: number = 13;
    public static readonly keyCodeSpace: number = 32;

    // Screen size
    public static readonly screenWidthLarge: number = 1200;
    public static readonly screenWidthSmall: number = 1000;

	// Bot commands
	public static readonly submitJoinProjectTaskModule: string = "joinproject";
	public static readonly closePreferencesTaskModule: string = "close";

    public static readonly lazyLoadPerPagePostCount: number = 50;
	public static readonly maxPrivateListPostCount: number = 50;
	public static readonly postTitleMaxLength: number = 100;
    public static readonly postDesriptionMaxLength: number = 400;
    public static readonly postDesriptionMinLength: number = 200;
	public static readonly postContentUrlMaxLength: number = 400;
    public static readonly skillsMaxCountPreferences: number = 5;
    public static readonly closeProjectAcquiredSkillsMaxLength: number = 20;
    public static readonly closeProjectFeedBackMaxLength: number = 250;


    public static readonly projectTitleMaxLength: number = 100;
    public static readonly projectDescriptionMaxLength: number = 400;
    public static readonly projectDescriptionMinLength: number = 200;
    public static readonly projectContentUrlMaxLength: number = 400;
    public static readonly skillMaxLength: number = 20;
    public static readonly projectUrlValidationRegEx: RegExp = /^http(s)?:\/\/(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

	public static readonly urlValidationRegEx: RegExp = /^http(s)?:\/\/(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

	public static readonly postTypes: Array<IPostType> = [
		{ name: "Not started", id: "1", color: "#E4A512" },
        { name: "Active", id: "2", color: "#2D6943" },
        { name: "Blocked", id: "3", color: "#B9324E" },
        { name: "Closed", id: "4", color: "#84838A" }
    ];

	public static readonly sortBy: Array<IPostType> = [
		{ name: "Newest", id: "Newest", color: "" },
		{ name: "Popularity", id: "Popularity", color: "" }
    ];

	public static readonly avatarColors: Array<string> = [
        "#B3DBF2", "#A7CFE8", "#92E0EA", "#ABDDD3", "#F7B189",
        "#EE9889", "#EEC7C2", "#FAC1B4", "#FFB8C6", "#D8A3D8",
        "#BBB0D6", "#B4A0FF", "#AAE5AA", "#E6EDC0"];
}