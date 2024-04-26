'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">ng-frontend</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/EntryModule.html" data-type="entity-link" >EntryModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/HelpCenterModule.html" data-type="entity-link" >HelpCenterModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ProjectModule.html" data-type="entity-link" >ProjectModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TagBuildModule.html" data-type="entity-link" >TagBuildModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationFormComponent.html" data-type="entity-link" >ApplicationFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AuthenticationFormComponent.html" data-type="entity-link" >AuthenticationFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BrowserFormComponent.html" data-type="entity-link" >BrowserFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailViewComponent.html" data-type="entity-link" >DetailViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditorComponent.html" data-type="entity-link" >EditorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EntryComponent.html" data-type="entity-link" >EntryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ErrorDialogComponent.html" data-type="entity-link" >ErrorDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GtmFormComponent.html" data-type="entity-link" >GtmFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HelpCenterComponent.html" data-type="entity-link" >HelpCenterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeViewComponent.html" data-type="entity-link" >HomeViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InitProjectFormComponent.html" data-type="entity-link" >InitProjectFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InitProjectViewComponent.html" data-type="entity-link" >InitProjectViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MainContentComponent.html" data-type="entity-link" >MainContentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NewReportViewComponent.html" data-type="entity-link" >NewReportViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProjectInfoFormComponent.html" data-type="entity-link" >ProjectInfoFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProjectIoFormComponent.html" data-type="entity-link" >ProjectIoFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProjectItemComponent.html" data-type="entity-link" >ProjectItemComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProjectListComponent.html" data-type="entity-link" >ProjectListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProjectViewComponent.html" data-type="entity-link" >ProjectViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportDetailPanelsComponent.html" data-type="entity-link" >ReportDetailPanelsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportTableComponent.html" data-type="entity-link" >ReportTableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportTableToolbarComponent.html" data-type="entity-link" >ReportTableToolbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportViewComponent.html" data-type="entity-link" >ReportViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RootFormComponent.html" data-type="entity-link" >RootFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SettingsViewComponent.html" data-type="entity-link" >SettingsViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SideBarComponent.html" data-type="entity-link" >SideBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SideNavListComponent.html" data-type="entity-link" >SideNavListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SnackBarComponent.html" data-type="entity-link" >SnackBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TagBuildViewComponent.html" data-type="entity-link" >TagBuildViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ToolbarComponent.html" data-type="entity-link" >ToolbarComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/InstantErrorStateMatcher.html" data-type="entity-link" >InstantErrorStateMatcher</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/ConfigurationService.html" data-type="entity-link" >ConfigurationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DataLayerService.html" data-type="entity-link" >DataLayerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DataSourceFacadeService.html" data-type="entity-link" >DataSourceFacadeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EditorService.html" data-type="entity-link" >EditorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GtmOperatorService.html" data-type="entity-link" >GtmOperatorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImageService.html" data-type="entity-link" >ImageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProjectDataSourceService.html" data-type="entity-link" >ProjectDataSourceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProjectFacadeService.html" data-type="entity-link" >ProjectFacadeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProjectInfoService.html" data-type="entity-link" >ProjectInfoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProjectIoService.html" data-type="entity-link" >ProjectIoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/QaRequestService.html" data-type="entity-link" >QaRequestService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RecordingService.html" data-type="entity-link" >RecordingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportDetailsService.html" data-type="entity-link" >ReportDetailsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportService.html" data-type="entity-link" >ReportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SettingsService.html" data-type="entity-link" >SettingsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SpecService.html" data-type="entity-link" >SpecService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TestRunningFacadeService.html" data-type="entity-link" >TestRunningFacadeService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/TopicNode.html" data-type="entity-link" >TopicNode</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/BlobToUrlPipe.html" data-type="entity-link" >BlobToUrlPipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});