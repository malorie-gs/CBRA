const supabaseUrl =
    'https://xjbysfrceqtljatsijsy.supabase.co';

const supabaseKey =
    'sb_publishable_iRC9CutWA2fMgucVMtiOEw_f7uSu-3W';

const supabaseClient =
    window.supabase.createClient(
        supabaseUrl,
        supabaseKey
    );


// =========================
// ELEMENTS
// =========================

const caseList =
    document.querySelector('.case-list');

const searchInput =
    document.getElementById('case-search');

const sortSelect =
    document.getElementById('sort-filter');

const offenseFilter =
    document.getElementById('offense-filter');

const classificationFilter =
    document.getElementById('classification-filter');

const statusFilter =
    document.getElementById('status-filter');

const outcomeFilter =
    document.getElementById('outcome-filter');

const countryFilter =
    document.getElementById('country-filter');

const stateFilter =
    document.getElementById('state-filter');

const cityFilter =
    document.getElementById('city-filter');

const tagFilter =
    document.getElementById('tag-filter');

const clearFilters =
    document.getElementById('clear-filters');

const caseCount =
    document.getElementById('case-count');

const filterSummary =
    document.getElementById('filter-summary');


// =========================
// DATA
// =========================

let allCases = [];
let allTags = [];
let allCaseTags = [];


// =========================
// INITIALIZE FILTERS
// =========================

function initializeArchiveFilters() {

    searchInput.value = '';

    sortSelect.value = 'date';

    offenseFilter.value = 'all';

    classificationFilter.value = 'all';

    statusFilter.value = 'all';

    outcomeFilter.value = 'all';

    countryFilter.value = 'all';

    stateFilter.value = 'all';

    cityFilter.value = 'all';

    tagFilter.value = 'all';
}


// =========================
// LOAD CASES
// =========================

async function loadCases() {

    const {
        data,
        error
    } = await supabaseClient
        .from('cases')
        .select('*');

    if (error) {

        console.error(
            'Database error:',
            error
        );

        caseList.innerHTML = `
            <div class="no-cases">
                <h3>Unable to load cases</h3>
                <p>
                    There was a problem loading the case archive.
                </p>
            </div>
        `;

        return false;
    }

    allCases = data || [];

    await loadTags();

    await loadCaseTags();

    loadOffenses();

    loadClassifications();

    loadStatuses();

    loadOutcomes();

    loadCountries();

    loadStates();

    loadCities();

    return true;
}


// =========================
// FILTER OPTIONS
// =========================

function createFilterOptions(
    select,
    values,
    defaultText
) {

    select.innerHTML =
        `<option value="all">${defaultText}</option>`;

    values.forEach(function (value) {

        const option =
            document.createElement('option');

        option.value = value;

        option.textContent = value;

        select.appendChild(option);
    });
}


// =========================
// OFFENSES
// =========================

function loadOffenses() {

    const values = [
        ...new Set(
            allCases
                .map(x => x.offense)
                .filter(Boolean)
        )
    ].sort();

    createFilterOptions(
        offenseFilter,
        values,
        'All Offenses'
    );
}


// =========================
// CLASSIFICATIONS
// =========================

function loadClassifications() {

    const values = [
        ...new Set(
            allCases
                .map(x => x.classification)
                .filter(Boolean)
        )
    ].sort();

    createFilterOptions(
        classificationFilter,
        values,
        'All Classifications'
    );
}


// =========================
// STATUSES
// =========================

function loadStatuses() {

    const values = [
        ...new Set(
            allCases
                .map(x => x.case_status)
                .filter(Boolean)
        )
    ].sort();

    createFilterOptions(
        statusFilter,
        values,
        'All Case Statuses'
    );
}


// =========================
// OUTCOMES
// =========================

function loadOutcomes() {

    const values = [
        ...new Set(
            allCases
                .map(x => x.outcome)
                .filter(Boolean)
        )
    ].sort();

    createFilterOptions(
        outcomeFilter,
        values,
        'All Outcomes'
    );
}


// =========================
// COUNTRIES
// =========================

function loadCountries() {

    const values = [
        ...new Set(
            allCases
                .map(x => x.country)
                .filter(Boolean)
        )
    ].sort();

    createFilterOptions(
        countryFilter,
        values,
        'All Countries'
    );
}


// =========================
// STATES / PROVINCES
// =========================

function loadStates() {

    const country =
        countryFilter.value;

    const values = [
        ...new Set(
            allCases
                .filter(function (caseData) {

                    return (
                        country === 'all' ||
                        caseData.country === country
                    );

                })
                .map(x => x.state_province)
                .filter(Boolean)
        )
    ].sort();

    createFilterOptions(
        stateFilter,
        values,
        'All States / Provinces'
    );
}


// =========================
// CITIES
// =========================

function loadCities() {

    const country =
        countryFilter.value;

    const state =
        stateFilter.value;

    const values = [
        ...new Set(
            allCases
                .filter(function (caseData) {

                    return (
                        (
                            country === 'all' ||
                            caseData.country === country
                        )
                        &&
                        (
                            state === 'all' ||
                            caseData.state_province === state
                        )
                    );

                })
                .map(x => x.city)
                .filter(Boolean)
        )
    ].sort();

    createFilterOptions(
        cityFilter,
        values,
        'All Cities'
    );
}


// =========================
// TAGS
// =========================

async function loadTags() {

    const {
        data,
        error
    } = await supabaseClient
        .from('tags')
        .select('id, name')
        .order('name');

    if (error) {

        console.error(
            'Tag database error:',
            error
        );

        allTags = [];

        tagFilter.innerHTML =
            '<option value="all">All Research Tags</option>';

        return;
    }

    allTags = data || [];

    tagFilter.innerHTML =
        '<option value="all">All Research Tags</option>';

    allTags.forEach(function (tag) {

        const option =
            document.createElement('option');

        option.value = tag.id;

        option.textContent = tag.name;

        tagFilter.appendChild(option);
    });


    // Only apply a tag from the URL
    // when one was intentionally provided.

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const tagFromUrl =
        urlParams.get('tag');

    if (tagFromUrl) {

        tagFilter.value = tagFromUrl;
    }
}


// =========================
// CASE TAGS
// =========================

async function loadCaseTags() {

    const {
        data,
        error
    } = await supabaseClient
        .from('case_tags')
        .select('case_id, tag_id');

    if (error) {

        console.error(
            'Case tag database error:',
            error
        );

        allCaseTags = [];

        return;
    }

    allCaseTags = data || [];
}


// =========================
// GET TAGS FOR CASE
// =========================

function getTagsForCase(caseId) {

    const tagIds =
        allCaseTags
            .filter(function (item) {

                return (
                    Number(item.case_id) ===
                    Number(caseId)
                );

            })
            .map(function (item) {

                return Number(item.tag_id);

            });

    return allTags.filter(function (tag) {

        return tagIds.includes(
            Number(tag.id)
        );

    });
}


// =========================
// DISPLAY CASES
// =========================

function displayCases() {

    let cases = [...allCases];


    // =========================
    // CURRENT FILTER VALUES
    // =========================

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();

    const offense =
        offenseFilter.value;

    const classification =
        classificationFilter.value;

    const status =
        statusFilter.value;

    const outcome =
        outcomeFilter.value;

    const country =
        countryFilter.value;

    const state =
        stateFilter.value;

    const city =
        cityFilter.value;

    const selectedTag =
        tagFilter.value;


    // =========================
    // SEARCH
    // =========================

    if (searchTerm) {

        cases =
            cases.filter(function (caseData) {

                const caseTags =
                    getTagsForCase(caseData.id)
                        .map(tag => tag.name)
                        .join(' ');

                const text = `
                    ${caseData.case_name || ''}
                    ${caseData.offense || ''}
                    ${caseData.classification || ''}
                    ${caseData.case_status || ''}
                    ${caseData.outcome || ''}
                    ${caseData.case_date || ''}
                    ${caseData.city || ''}
                    ${caseData.state_province || ''}
                    ${caseData.country || ''}
                    ${caseTags}
                `.toLowerCase();

                return text.includes(
                    searchTerm
                );

            });
    }


    // =========================
    // OFFENSE FILTER
    // =========================

    if (offense !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return caseData.offense === offense;

            });
    }


    // =========================
    // CLASSIFICATION FILTER
    // =========================

    if (classification !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return (
                    caseData.classification ===
                    classification
                );

            });
    }


    // =========================
    // STATUS FILTER
    // =========================

    if (status !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return (
                    caseData.case_status ===
                    status
                );

            });
    }


    // =========================
    // OUTCOME FILTER
    // =========================

    if (outcome !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return (
                    caseData.outcome ===
                    outcome
                );

            });
    }


    // =========================
    // COUNTRY FILTER
    // =========================

    if (country !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return (
                    caseData.country ===
                    country
                );

            });
    }


    // =========================
    // STATE / PROVINCE FILTER
    // =========================

    if (state !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return (
                    caseData.state_province ===
                    state
                );

            });
    }


    // =========================
    // CITY FILTER
    // =========================

    if (city !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return (
                    caseData.city ===
                    city
                );

            });
    }


    // =========================
    // TAG FILTER
    // =========================

    if (selectedTag !== 'all') {

        cases =
            cases.filter(function (caseData) {

                return allCaseTags.some(
                    function (item) {

                        return (
                            Number(item.case_id) ===
                                Number(caseData.id)
                            &&
                            Number(item.tag_id) ===
                                Number(selectedTag)
                        );

                    }
                );

            });
    }


    // =========================
    // SORT
    // =========================

    if (sortSelect.value === 'date') {

        cases.sort(function (a, b) {

            return (
                new Date(b.case_date || 0) -
                new Date(a.case_date || 0)
            );

        });
    }


    if (sortSelect.value === 'name') {

        cases.sort(function (a, b) {

            return (
                (a.case_name || '')
                    .localeCompare(
                        b.case_name || ''
                    )
            );

        });
    }


    if (sortSelect.value === 'location') {

        cases.sort(function (a, b) {

            const locationA =
                [
                    a.country || '',
                    a.state_province || '',
                    a.city || ''
                ].join('');

            const locationB =
                [
                    b.country || '',
                    b.state_province || '',
                    b.city || ''
                ].join('');

            return locationA.localeCompare(
                locationB
            );

        });
    }


    // =========================
    // RESULT COUNT
    // =========================

    caseCount.textContent =
        `${cases.length} ${
            cases.length === 1
                ? 'case'
                : 'cases'
        } found`;


    updateFilterSummary();


    caseList.innerHTML = '';


    // =========================
    // NO RESULTS
    // =========================

    if (!cases.length) {

        caseList.innerHTML = `
            <div class="no-cases">

                <h3>No cases found</h3>

                <p>
                    Try changing or clearing your filters.
                </p>

            </div>
        `;

        return;
    }


    // =========================
    // CASE CARDS
    // =========================

    cases.forEach(function (caseData) {

        const card =
            document.createElement('div');

        card.classList.add(
            'case-card'
        );


        // =========================
        // LOCATION
        // =========================

        const location = [
            caseData.city,
            caseData.state_province,
            caseData.country
        ]
            .filter(Boolean)
            .join(', ');


        // =========================
        // TAGS
        // =========================

        const caseTags =
            getTagsForCase(
                caseData.id
            );


        const tagsHTML =
            caseTags.length
                ? `
                    <div class="archive-case-tags">

                        ${
                            caseTags
                                .map(function (tag) {

                                    return `
                                        <a
                                            class="archive-case-tag"
                                            href="archive.html?tag=${tag.id}"
                                        >
                                            ${tag.name}
                                        </a>
                                    `;

                                })
                                .join('')
                        }

                    </div>
                  `
                : '';


        // =========================
        // VICTIM / FATALITY INFO
        // =========================

        const hasVictims =
            caseData.victim_count !== null &&
            caseData.victim_count !== undefined;

        const hasFatalities =
            caseData.fatality_count !== null &&
            caseData.fatality_count !== undefined;


        const victimFatalityHTML =
            hasVictims || hasFatalities
                ? `

                    <p class="case-card-victim-count">

                        ${
                            hasVictims
                                ? `
                                    <strong>
                                        Victims:
                                    </strong>
                                    ${caseData.victim_count}
                                  `
                                : ''
                        }

                        ${
                            hasFatalities
                                ? `
                                    ${
                                        hasVictims
                                            ? ' • '
                                            : ''
                                    }

                                    <strong>
                                        Fatalities:
                                    </strong>
                                    ${caseData.fatality_count}
                                  `
                                : ''
                        }

                    </p>

                  `
                : '';


        // =========================
        // CARD HTML
        // =========================

        card.innerHTML = `

            <h3>
                ${caseData.case_name || ''}
            </h3>


            <div class="case-card-details">

                ${
                    caseData.case_date
                        ? `
                            <span>
                                ${caseData.case_date}
                            </span>
                          `
                        : ''
                }


                ${
                    caseData.offense
                        ? `
                            <span>
                                ${caseData.offense}
                            </span>
                          `
                        : ''
                }

            </div>


            ${victimFatalityHTML}


            ${
                caseData.classification
                    ? `
                        <p class="case-card-classification">

                            <strong>
                                Classification:
                            </strong>

                            ${caseData.classification}

                        </p>
                      `
                    : ''
            }


            ${
                caseData.case_status
                    ? `
                        <p class="case-card-status">

                            <strong>
                                Status:
                            </strong>

                            ${caseData.case_status}

                        </p>
                      `
                    : ''
            }


            ${
                caseData.outcome
                    ? `
                        <p class="case-card-outcome">

                            <strong>
                                Outcome:
                            </strong>

                            ${caseData.outcome}

                        </p>
                      `
                    : ''
            }


            ${
                location
                    ? `
                        <p class="case-card-location">
                            ${location}
                        </p>
                      `
                    : ''
            }


            ${tagsHTML}

        `;


        // =========================
        // CASE CLICK
        // =========================

        card.addEventListener(
            'click',
            function () {

                window.location.href =
                    `case.html?id=${caseData.id}`;

            }
        );


        // =========================
        // TAG CLICK
        // =========================

        card
            .querySelectorAll(
                '.archive-case-tag'
            )
            .forEach(function (tagLink) {

                tagLink.addEventListener(
                    'click',
                    function (event) {

                        event.stopPropagation();

                    }
                );

            });


        caseList.appendChild(card);

    });
}


// =========================
// FILTER SUMMARY
// =========================

function updateFilterSummary() {

    const filters = [];


    if (
        searchInput.value
            .trim()
    ) {

        filters.push(
            `Search: "${searchInput.value.trim()}"`
        );
    }


    if (
        offenseFilter.value !== 'all'
    ) {

        filters.push(
            `Offense: ${offenseFilter.value}`
        );
    }


    if (
        classificationFilter.value !== 'all'
    ) {

        filters.push(
            `Classification: ${classificationFilter.value}`
        );
    }


    if (
        statusFilter.value !== 'all'
    ) {

        filters.push(
            `Status: ${statusFilter.value}`
        );
    }


    if (
        outcomeFilter.value !== 'all'
    ) {

        filters.push(
            `Outcome: ${outcomeFilter.value}`
        );
    }


    if (
        countryFilter.value !== 'all'
    ) {

        filters.push(
            countryFilter.value
        );
    }


    if (
        stateFilter.value !== 'all'
    ) {

        filters.push(
            stateFilter.value
        );
    }


    if (
        cityFilter.value !== 'all'
    ) {

        filters.push(
            cityFilter.value
        );
    }


    if (
        tagFilter.value !== 'all'
    ) {

        const tag =
            allTags.find(function (tag) {

                return (
                    Number(tag.id) ===
                    Number(tagFilter.value)
                );

            });


        if (tag) {

            filters.push(
                `Tag: ${tag.name}`
            );

        }
    }


    filterSummary.textContent =
        filters.length
            ? `Filtered by ${filters.join(' • ')}`
            : 'Showing all archived cases';
}


// =========================
// CLEAR FILTERS
// =========================

function clearAllFilters() {

    searchInput.value = '';

    sortSelect.value = 'date';

    offenseFilter.value = 'all';

    classificationFilter.value =
        'all';

    statusFilter.value =
        'all';

    outcomeFilter.value =
        'all';

    countryFilter.value =
        'all';


    loadStates();


    stateFilter.value =
        'all';


    loadCities();


    cityFilter.value =
        'all';


    tagFilter.value =
        'all';


    history.replaceState(
        null,
        '',
        'archive.html'
    );


    displayCases();
}


// =========================
// EVENT LISTENERS
// =========================

searchInput.addEventListener(
    'input',
    displayCases
);


sortSelect.addEventListener(
    'change',
    displayCases
);


offenseFilter.addEventListener(
    'change',
    displayCases
);


classificationFilter.addEventListener(
    'change',
    displayCases
);


statusFilter.addEventListener(
    'change',
    displayCases
);


outcomeFilter.addEventListener(
    'change',
    displayCases
);


countryFilter.addEventListener(
    'change',
    function () {

        loadStates();

        stateFilter.value =
            'all';

        loadCities();

        cityFilter.value =
            'all';

        displayCases();

    }
);


stateFilter.addEventListener(
    'change',
    function () {

        loadCities();

        cityFilter.value =
            'all';

        displayCases();

    }
);


cityFilter.addEventListener(
    'change',
    displayCases
);


tagFilter.addEventListener(
    'change',
    displayCases
);


clearFilters.addEventListener(
    'click',
    clearAllFilters
);


// =========================
// START
// =========================

async function initializeArchive() {

    // FIRST:
    // Set every filter to its default state.

    initializeArchiveFilters();


    // SECOND:
    // Load the database data and filter options.

    const loaded =
        await loadCases();


    // Stop if the database failed.

    if (!loaded) {
        return;
    }


    // THIRD:
    // Re-establish the dependent filters.

    loadStates();

    stateFilter.value =
        'all';

    loadCities();

    cityFilter.value =
        'all';


    // FOURTH:
    // Display the cases ONLY after
    // everything is initialized.

    displayCases();
}


initializeArchive();