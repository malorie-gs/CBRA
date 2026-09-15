/* =========================================================
   CBRA — DATA & STATISTICS
   ========================================================= */


/* ---------------------------------------------------------
   SUPABASE
   --------------------------------------------------------- */

const supabaseUrl =
    'https://xjbysfrceqtljatsijsy.supabase.co';

const supabaseKey =
    'sb_publishable_iRC9CutWA2fMgucVMtiOEw_f7uSu-3W';

const supabaseClient =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );


/* ---------------------------------------------------------
   GENERAL FILTERS
   --------------------------------------------------------- */

const countryFilter =
    document.getElementById('stat-country');

const stateFilter =
    document.getElementById('stat-state');

const cityFilter =
    document.getElementById('stat-city');

const offenseFilter =
    document.getElementById('stat-offense');

const classificationFilter =
    document.getElementById(
        'stat-classification'
    );

const outcomeFilter =
    document.getElementById('stat-outcome');

const roleFilter =
    document.getElementById('stat-role');

const genderFilter =
    document.getElementById('stat-gender');


/* ---------------------------------------------------------
   TAG FILTERS
   --------------------------------------------------------- */

const crimeTagFilter =
    document.getElementById(
        'stat-crime-tag'
    );

const influenceTagFilter =
    document.getElementById(
        'stat-influence-tag'
    );

const mentalHealthTagFilter =
    document.getElementById(
        'stat-mental-health-tag'
    );

const demographicTagFilter =
    document.getElementById(
        'stat-demographic-tag'
    );

const tagMode =
    document.getElementById('tag-mode');


/* ---------------------------------------------------------
   RESULTS
   --------------------------------------------------------- */

const caseCount =
    document.getElementById('case-count');

const casePercentage =
    document.getElementById(
        'case-percentage'
    );

const archiveTotal =
    document.getElementById(
        'archive-total'
    );

const querySummary =
    document.getElementById(
        'query-summary'
    );


/* ---------------------------------------------------------
   CHARTS
   --------------------------------------------------------- */

const locationChart =
    document.getElementById(
        'location-chart'
    );

const classificationChart =
    document.getElementById(
        'classification-chart'
    );

const outcomeChart =
    document.getElementById(
        'outcome-chart'
    );


/* ---------------------------------------------------------
   TAG BREAKDOWN CHARTS
   --------------------------------------------------------- */

const crimeTagChart =
    document.getElementById(
        'crime-tag-chart'
    );

const influenceTagChart =
    document.getElementById(
        'influence-tag-chart'
    );

const mentalHealthTagChart =
    document.getElementById(
        'mental-health-tag-chart'
    );

const demographicTagChart =
    document.getElementById(
        'demographic-tag-chart'
    );


/* ---------------------------------------------------------
   TAG PERCENTAGE CHARTS
   --------------------------------------------------------- */

const crimeTagPercentageChart =
    document.getElementById(
        'crime-tag-percentage-chart'
    );

const influenceTagPercentageChart =
    document.getElementById(
        'influence-tag-percentage-chart'
    );

const mentalHealthTagPercentageChart =
    document.getElementById(
        'mental-health-tag-percentage-chart'
    );

const demographicTagPercentageChart =
    document.getElementById(
        'demographic-tag-percentage-chart'
    );


/* ---------------------------------------------------------
   MATCHING CASES
   --------------------------------------------------------- */

const matchingCases =
    document.getElementById(
        'matching-cases'
    );


/* ---------------------------------------------------------
   DATA
   --------------------------------------------------------- */

let allCases = [];
let allTags = [];
let allCaseTags = [];
let allCasePeople = [];
let allPeople = [];


/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadData() {

    const cases =
        await supabaseClient
            .from('cases')
            .select('*');


    const tags =
        await supabaseClient
            .from('tags')
            .select(
                'id, name, category'
            )
            .order('name');


    const caseTags =
        await supabaseClient
            .from('case_tags')
            .select(
                'case_id, tag_id'
            );


    const casePeople =
        await supabaseClient
            .from('case_people')
            .select(
                'case_id, role, person_id'
            );


    const people =
        await supabaseClient
            .from('people')
            .select(
                'id, gender'
            );


    if (
        cases.error ||
        tags.error ||
        caseTags.error ||
        casePeople.error ||
        people.error
    ) {

        console.error(
            cases.error ||
            tags.error ||
            caseTags.error ||
            casePeople.error ||
            people.error
        );

        return;
    }


    allCases =
        cases.data || [];

    allTags =
        tags.data || [];

    allCaseTags =
        caseTags.data || [];

    allCasePeople =
        casePeople.data || [];

    allPeople =
        people.data || [];


    loadCountries();

    loadStates();

    loadCities();

    loadOffenses();

    loadClassifications();

    loadOutcomes();

    loadRoles();

    loadGenders();

    loadTagFilters();

    updateStatistics();

}


/* =========================================================
   GENERIC FILTER OPTIONS
   ========================================================= */

function createFilterOptions(
    select,
    values,
    defaultText
) {

    select.innerHTML =
        `<option value="all">${defaultText}</option>`;


    values.forEach(
        value => {

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                value;

            option.textContent =
                value;

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   COUNTRY
   ========================================================= */

function loadCountries() {

    const values = [
        ...new Set(
            allCases
                .map(
                    x => x.country
                )
                .filter(Boolean)
        )
    ].sort();


    createFilterOptions(
        countryFilter,
        values,
        'All Countries'
    );

}


/* =========================================================
   STATE / PROVINCE
   ========================================================= */

function loadStates() {

    const country =
        countryFilter.value;


    const values = [
        ...new Set(
            allCases
                .filter(
                    x =>
                        country === 'all' ||
                        x.country === country
                )
                .map(
                    x =>
                        x.state_province
                )
                .filter(Boolean)
        )
    ].sort();


    createFilterOptions(
        stateFilter,
        values,
        'All States / Provinces'
    );

}


/* =========================================================
   CITY
   ========================================================= */

function loadCities() {

    const country =
        countryFilter.value;

    const state =
        stateFilter.value;


    const values = [
        ...new Set(
            allCases
                .filter(
                    x =>
                        (
                            country === 'all' ||
                            x.country === country
                        ) &&
                        (
                            state === 'all' ||
                            x.state_province === state
                        )
                )
                .map(
                    x => x.city
                )
                .filter(Boolean)
        )
    ].sort();


    createFilterOptions(
        cityFilter,
        values,
        'All Cities'
    );

}


/* =========================================================
   OFFENSE
   ========================================================= */

/*
   Offenses are now gathered from BOTH:

   1. cases.offense
      Primary offense

   2. cases.additional_offenses
      Additional charges

   A case can therefore appear under multiple
   offense selections.
*/

function loadOffenses() {

    const offenses = [];


    allCases.forEach(
        caseData => {

            /* ---------------------------------------------
               PRIMARY OFFENSE
               --------------------------------------------- */

            if (
                caseData.offense
            ) {

                offenses.push(
                    caseData.offense.trim()
                );

            }


            /* ---------------------------------------------
               ADDITIONAL OFFENSES
               --------------------------------------------- */

            getAdditionalOffenses(
                caseData
            ).forEach(
                offense => {

                    offenses.push(
                        offense
                    );

                }
            );

        }
    );


    const values =
        [
            ...new Set(
                offenses.filter(Boolean)
            )
        ].sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
        );


    offenseFilter.innerHTML =
        '';


    values.forEach(
        offense => {

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                offense;

            option.textContent =
                offense;

            offenseFilter.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   GET ADDITIONAL OFFENSES
   ========================================================= */

/*
   Additional charges are currently stored in the
   cases.additional_offenses field.

   This helper supports comma-separated charges and
   also handles semicolon-separated values if any
   older records use them.
*/

function getAdditionalOffenses(
    caseData
) {

    if (
        !caseData.additional_offenses
    ) {

        return [];

    }


    if (
        Array.isArray(
            caseData.additional_offenses
        )
    ) {

        return caseData.additional_offenses
            .map(
                value =>
                    String(value).trim()
            )
            .filter(Boolean);

    }


    return String(
        caseData.additional_offenses
    )
        .split(
            /[,;]/
        )
        .map(
            value =>
                value.trim()
        )
        .filter(Boolean);

}


/* =========================================================
   GET ALL OFFENSES FOR A CASE
   ========================================================= */

function getCaseOffenses(
    caseData
) {

    const offenses = [];


    /* ---------------------------------------------
       PRIMARY
       --------------------------------------------- */

    if (
        caseData.offense
    ) {

        offenses.push(
            caseData.offense.trim()
        );

    }


    /* ---------------------------------------------
       ADDITIONAL
       --------------------------------------------- */

    getAdditionalOffenses(
        caseData
    ).forEach(
        offense => {

            offenses.push(
                offense
            );

        }
    );


    return [
        ...new Set(
            offenses.filter(Boolean)
        )
    ];

}


/* =========================================================
   CLASSIFICATION
   ========================================================= */

function loadClassifications() {

    const values = [
        ...new Set(
            allCases
                .map(
                    x =>
                        x.classification
                )
                .filter(Boolean)
        )
    ].sort();


    createFilterOptions(
        classificationFilter,
        values,
        'All Classifications'
    );

}


/* =========================================================
   OUTCOME
   ========================================================= */

function loadOutcomes() {

    const values = [
        ...new Set(
            allCases
                .map(
                    x => x.outcome
                )
                .filter(Boolean)
        )
    ].sort();


    createFilterOptions(
        outcomeFilter,
        values,
        'All Outcomes'
    );

}


/* =========================================================
   ROLES
   ========================================================= */

function loadRoles() {

    const values = [
        ...new Set(
            allCasePeople
                .map(
                    x => x.role
                )
                .filter(Boolean)
        )
    ].sort();


    createFilterOptions(
        roleFilter,
        values,
        'All Roles'
    );

}


/* =========================================================
   GENDERS
   ========================================================= */

function loadGenders() {

    const values = [
        ...new Set(
            allPeople
                .map(
                    x => x.gender
                )
                .filter(Boolean)
        )
    ].sort();


    createFilterOptions(
        genderFilter,
        values,
        'All Genders'
    );

}


/* =========================================================
   TAG FILTERS
   ========================================================= */

function loadTagFilters() {

    loadTagFilter(
        crimeTagFilter,
        'crime'
    );


    loadTagFilter(
        influenceTagFilter,
        'influence'
    );


    loadTagFilter(
        mentalHealthTagFilter,
        'mental_health'
    );


    loadTagFilter(
        demographicTagFilter,
        'demographic'
    );

}


/* =========================================================
   LOAD ONE TAG CATEGORY
   ========================================================= */

function loadTagFilter(
    select,
    category
) {

    select.innerHTML = '';


    const tags =
        allTags
            .filter(
                tag =>
                    tag.category ===
                    category
            )
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );


    tags.forEach(
        tag => {

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                tag.id;

            option.textContent =
                tag.name;

            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   GET SELECTED TAGS
   ========================================================= */

function getSelectedTags() {

    const selected = [];


    [
        crimeTagFilter,
        influenceTagFilter,
        mentalHealthTagFilter,
        demographicTagFilter
    ].forEach(
        filter => {

            [
                ...filter.selectedOptions
            ].forEach(
                option => {

                    selected.push(
                        Number(
                            option.value
                        )
                    );

                }
            );

        }
    );


    return selected;

}


/* =========================================================
   GET TAGS FOR A CASE
   ========================================================= */

function getCaseTagIds(
    caseId
) {

    return allCaseTags
        .filter(
            x =>
                Number(x.case_id) ===
                Number(caseId)
        )
        .map(
            x =>
                Number(x.tag_id)
        );

}


/* =========================================================
   GET SELECTED OFFENSES
   ========================================================= */

function getSelectedOffenses() {

    return [
        ...offenseFilter.selectedOptions
    ]
        .map(
            option =>
                option.value
        )
        .filter(Boolean);

}


/* =========================================================
   CHECK WHETHER CASE HAS OFFENSE
   ========================================================= */

function caseHasSelectedOffense(
    caseData,
    selectedOffenses
) {

    if (
        !selectedOffenses.length
    ) {

        return true;

    }


    const caseOffenses =
        getCaseOffenses(
            caseData
        );


    return selectedOffenses.some(
        selectedOffense =>
            caseOffenses.some(
                caseOffense =>
                    caseOffense ===
                    selectedOffense
            )
    );

}


/* =========================================================
   GET MATCHING CASES
   ========================================================= */

function getMatchingCases() {

    let cases =
        [...allCases];


    const country =
        countryFilter.value;

    const state =
        stateFilter.value;

    const city =
        cityFilter.value;

    const selectedOffenses =
        getSelectedOffenses();

    const classification =
        classificationFilter.value;

    const outcome =
        outcomeFilter.value;

    const role =
        roleFilter.value;

    const gender =
        genderFilter.value;

    const selectedTags =
        getSelectedTags();


    /* ---------------------------------------------
       COUNTRY
       --------------------------------------------- */

    if (
        country !== 'all'
    ) {

        cases =
            cases.filter(
                x =>
                    x.country ===
                    country
            );

    }


    /* ---------------------------------------------
       STATE / PROVINCE
       --------------------------------------------- */

    if (
        state !== 'all'
    ) {

        cases =
            cases.filter(
                x =>
                    x.state_province ===
                    state
            );

    }


    /* ---------------------------------------------
       CITY
       --------------------------------------------- */

    if (
        city !== 'all'
    ) {

        cases =
            cases.filter(
                x =>
                    x.city ===
                    city
            );

    }


    /* ---------------------------------------------
       OFFENSES
       --------------------------------------------- */

    if (
        selectedOffenses.length
    ) {

        cases =
            cases.filter(
                caseData =>
                    caseHasSelectedOffense(
                        caseData,
                        selectedOffenses
                    )
            );

    }


    /* ---------------------------------------------
       CLASSIFICATION
       --------------------------------------------- */

    if (
        classification !==
        'all'
    ) {

        cases =
            cases.filter(
                x =>
                    x.classification ===
                    classification
            );

    }


    /* ---------------------------------------------
       OUTCOME
       --------------------------------------------- */

    if (
        outcome !== 'all'
    ) {

        cases =
            cases.filter(
                x =>
                    x.outcome ===
                    outcome
            );

    }


    /* ---------------------------------------------
       PERSON FILTERS
       --------------------------------------------- */

    if (
        role !== 'all' ||
        gender !== 'all'
    ) {

        const matchingPeople =
            allCasePeople.filter(
                person => {

                    const personData =
                        allPeople.find(
                            x =>
                                Number(x.id) ===
                                Number(
                                    person.person_id
                                )
                        );


                    return (
                        (
                            role === 'all' ||
                            person.role === role
                        ) &&
                        (
                            gender === 'all' ||
                            personData?.gender ===
                                gender
                        )
                    );

                }
            );


        const ids =
            matchingPeople.map(
                x =>
                    Number(
                        x.case_id
                    )
            );


        cases =
            cases.filter(
                x =>
                    ids.includes(
                        Number(x.id)
                    )
            );

    }


    /* ---------------------------------------------
       RESEARCH TAGS
       --------------------------------------------- */

    if (
        selectedTags.length
    ) {

        cases =
            cases.filter(
                caseData => {

                    const caseTags =
                        getCaseTagIds(
                            caseData.id
                        );


                    if (
                        tagMode.value ===
                        'any'
                    ) {

                        return selectedTags.some(
                            tag =>
                                caseTags.includes(
                                    tag
                                )
                        );

                    }


                    return selectedTags.every(
                        tag =>
                            caseTags.includes(
                                tag
                            )
                    );

                }
            );

    }


    return cases;

}


/* =========================================================
   UPDATE STATISTICS
   ========================================================= */

function updateStatistics() {

    const cases =
        getMatchingCases();


    const total =
        allCases.length;


    caseCount.textContent =
        cases.length;


    archiveTotal.textContent =
        total;


    casePercentage.textContent =
        total
            ? `${(
                (
                    cases.length /
                    total
                ) *
                100
            ).toFixed(1)}%`
            : '0%';


    updateSummary();


    updateLocationChart(
        cases
    );


    updateSimpleChart(
        cases,
        'classification',
        classificationChart,
        'No classification data available.'
    );


    updateSimpleChart(
        cases,
        'outcome',
        outcomeChart,
        'No outcome data available.'
    );


    updateTagCharts(
        cases
    );


    updateMatchingCases(
        cases
    );

}


/* =========================================================
   QUERY SUMMARY
   ========================================================= */

function updateSummary() {

    const parts = [];


    if (
        countryFilter.value !==
        'all'
    ) {

        parts.push(
            countryFilter.value
        );

    }


    if (
        stateFilter.value !==
        'all'
    ) {

        parts.push(
            stateFilter.value
        );

    }


    if (
        cityFilter.value !==
        'all'
    ) {

        parts.push(
            cityFilter.value
        );

    }


    /* ---------------------------------------------
       OFFENSE SUMMARY
       --------------------------------------------- */

    const selectedOffenses =
        getSelectedOffenses();


    if (
        selectedOffenses.length
    ) {

        parts.push(
            `Offenses: ${
                selectedOffenses.join(
                    ', '
                )
            }`
        );

    }


    if (
        classificationFilter.value !==
        'all'
    ) {

        parts.push(
            `Classification: ${
                classificationFilter.value
            }`
        );

    }


    if (
        outcomeFilter.value !==
        'all'
    ) {

        parts.push(
            `Outcome: ${
                outcomeFilter.value
            }`
        );

    }


    if (
        roleFilter.value !==
        'all'
    ) {

        parts.push(
            `Role: ${
                roleFilter.value
            }`
        );

    }


    if (
        genderFilter.value !==
        'all'
    ) {

        parts.push(
            `Gender: ${
                genderFilter.value
            }`
        );

    }


    /* ---------------------------------------------
       TAG SUMMARY
       --------------------------------------------- */

    const tagGroups = [];


    addSelectedTagSummary(
        tagGroups,
        crimeTagFilter,
        'Crime'
    );


    addSelectedTagSummary(
        tagGroups,
        influenceTagFilter,
        'Influence'
    );


    addSelectedTagSummary(
        tagGroups,
        mentalHealthTagFilter,
        'Mental Health'
    );


    addSelectedTagSummary(
        tagGroups,
        demographicTagFilter,
        'Demographic'
    );


    if (
        tagGroups.length
    ) {

        parts.push(
            `${
                tagMode.value === 'all'
                    ? 'ALL'
                    : 'ANY'
            } tags: ${
                tagGroups.join(
                    ' • '
                )
            }`
        );

    }


    querySummary.textContent =
        parts.length
            ? `Cases matching: ${
                parts.join(
                    ' • '
                )
              }`
            : 'All cases in the archive';

}


/* =========================================================
   TAG SUMMARY HELPER
   ========================================================= */

function addSelectedTagSummary(
    groups,
    filter,
    categoryName
) {

    const names =
        [
            ...filter.selectedOptions
        ].map(
            option =>
                option.textContent
        );


    if (
        names.length
    ) {

        groups.push(
            `${categoryName}: ${
                names.join(
                    ', '
                )
            }`
        );

    }

}


/* =========================================================
   LOCATION CHART
   ========================================================= */

function updateLocationChart(
    cases
) {

    updateSimpleChart(
        cases,
        'country',
        locationChart,
        'No location data available.'
    );

}


/* =========================================================
   SIMPLE CHART
   ========================================================= */

function updateSimpleChart(
    cases,
    field,
    container,
    emptyMessage
) {

    if (
        !cases.length
    ) {

        container.innerHTML =
            `<p>${emptyMessage}</p>`;

        return;

    }


    const counts = {};


    cases.forEach(
        caseData => {

            const value =
                caseData[field] ||
                'Unknown';


            counts[value] =
                (
                    counts[value] ||
                    0
                ) + 1;

        }
    );


    const entries =
        Object.entries(
            counts
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );


    container.innerHTML =
        '';


    entries.forEach(
        ([name, count]) => {

            const percent =
                (
                    count /
                    cases.length
                ) *
                100;


            container.innerHTML += `

                <div class="statistics-bar-row">

                    <div class="statistics-bar-label">

                        ${name}
                        —
                        ${count}
                        (${percent.toFixed(1)}%)

                    </div>

                    <div class="statistics-bar">

                        <div
                            class="statistics-bar-fill"
                            style="width:${Math.min(
                                percent,
                                100
                            )}%"
                        ></div>

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   TAG CHARTS
   ========================================================= */

function updateTagCharts(
    cases
) {

    updateTagCategoryCharts(
        cases,
        'crime',
        crimeTagChart,
        crimeTagPercentageChart,
        'No crime tag data available.'
    );


    updateTagCategoryCharts(
        cases,
        'influence',
        influenceTagChart,
        influenceTagPercentageChart,
        'No influence tag data available.'
    );


    updateTagCategoryCharts(
        cases,
        'mental_health',
        mentalHealthTagChart,
        mentalHealthTagPercentageChart,
        'No mental-health tag data available.'
    );


    updateTagCategoryCharts(
        cases,
        'demographic',
        demographicTagChart,
        demographicTagPercentageChart,
        'No demographic tag data available.'
    );

}


/* =========================================================
   ONE TAG CATEGORY
   ========================================================= */

function updateTagCategoryCharts(
    cases,
    category,
    chartContainer,
    percentageContainer,
    emptyMessage
) {

    const counts = {};


    cases.forEach(
        caseData => {

            const caseTagIds =
                getCaseTagIds(
                    caseData.id
                );


            caseTagIds.forEach(
                tagId => {

                    const tag =
                        allTags.find(
                            x =>
                                Number(x.id) ===
                                Number(tagId)
                        );


                    if (
                        !tag ||
                        tag.category !==
                            category
                    ) {

                        return;

                    }


                    counts[tag.id] =
                        (
                            counts[tag.id] ||
                            0
                        ) + 1;

                }
            );

        }
    );


    const entries =
        Object.entries(
            counts
        )
        .map(
            ([id, count]) => {

                const tag =
                    allTags.find(
                        x =>
                            Number(x.id) ===
                            Number(id)
                    );


                return {

                    name:
                        tag?.name ||
                        'Unknown',

                    count

                };

            }
        )
        .sort(
            (a, b) =>
                b.count - a.count
        );


    chartContainer.innerHTML =
        '';

    percentageContainer.innerHTML =
        '';


    if (
        !entries.length
    ) {

        chartContainer.innerHTML =
            `<p>${emptyMessage}</p>`;

        percentageContainer.innerHTML =
            `<p>${emptyMessage}</p>`;

        return;

    }


    entries.forEach(
        item => {

            const percent =
                cases.length
                    ? (
                        item.count /
                        cases.length
                    ) * 100
                    : 0;


            /* -----------------------------------------
               COUNT CHART
               ----------------------------------------- */

            chartContainer.innerHTML += `

                <div class="statistics-bar-row">

                    <div class="statistics-bar-label">

                        ${item.name}
                        —
                        ${item.count}

                    </div>

                    <div class="statistics-bar">

                        <div
                            class="statistics-bar-fill"
                            style="width:${Math.min(
                                percent,
                                100
                            )}%"
                        ></div>

                    </div>

                </div>

            `;


            /* -----------------------------------------
               PERCENTAGE CHART
               ----------------------------------------- */

            percentageContainer.innerHTML += `

                <div class="statistics-bar-row">

                    <div class="statistics-bar-label">

                        ${item.name}
                        —
                        ${percent.toFixed(1)}%

                    </div>

                    <div class="statistics-bar">

                        <div
                            class="statistics-bar-fill"
                            style="width:${Math.min(
                                percent,
                                100
                            )}%"
                        ></div>

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   MATCHING CASES
   ========================================================= */

function updateMatchingCases(
    cases
) {

    matchingCases.innerHTML =
        '';


    if (
        !cases.length
    ) {

        matchingCases.innerHTML =
            '<p>No cases found.</p>';

        return;

    }


    cases.forEach(
        caseData => {

            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'statistics-case';


            const offenses =
                getCaseOffenses(
                    caseData
                );


            card.innerHTML = `

                <h4>
                    ${caseData.case_name}
                </h4>

                ${
                    caseData.case_date
                        ? `
                            <p>
                                ${caseData.case_date}
                            </p>
                          `
                        : ''
                }

                ${
                    offenses.length
                        ? `
                            <p>
                                <strong>
                                    Offenses:
                                </strong>
                                ${offenses.join(
                                    ', '
                                )}
                            </p>
                          `
                        : ''
                }

                ${
                    caseData.classification
                        ? `
                            <p>
                                <strong>
                                    Classification:
                                </strong>
                                ${caseData.classification}
                            </p>
                          `
                        : ''
                }

                ${
                    caseData.outcome
                        ? `
                            <p>
                                <strong>
                                    Outcome:
                                </strong>
                                ${caseData.outcome}
                            </p>
                          `
                        : ''
                }

            `;


            card.addEventListener(
                'click',
                () => {

                    location.href =
                        `case.html?id=${caseData.id}`;

                }
            );


            matchingCases.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

countryFilter.addEventListener(
    'change',
    () => {

        loadStates();

        loadCities();

        updateStatistics();

    }
);


stateFilter.addEventListener(
    'change',
    () => {

        loadCities();

        updateStatistics();

    }
);


cityFilter.addEventListener(
    'change',
    updateStatistics
);


offenseFilter.addEventListener(
    'change',
    updateStatistics
);


classificationFilter.addEventListener(
    'change',
    updateStatistics
);


outcomeFilter.addEventListener(
    'change',
    updateStatistics
);


roleFilter.addEventListener(
    'change',
    updateStatistics
);


genderFilter.addEventListener(
    'change',
    updateStatistics
);


/* ---------------------------------------------------------
   TAG EVENTS
   --------------------------------------------------------- */

crimeTagFilter.addEventListener(
    'change',
    updateStatistics
);


influenceTagFilter.addEventListener(
    'change',
    updateStatistics
);


mentalHealthTagFilter.addEventListener(
    'change',
    updateStatistics
);


demographicTagFilter.addEventListener(
    'change',
    updateStatistics
);


tagMode.addEventListener(
    'change',
    updateStatistics
);


/* =========================================================
   START
   ========================================================= */

loadData();