/* =========================================
   CBRA — MANAGE CASES
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const SUPABASE_URL =
    "https://xjbysfrceqtljatsijsy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_iRC9CutWA2fMgucVMtiOEw_f7uSu-3W";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* -----------------------------------------
   STATE
   ----------------------------------------- */

let isCreatingNewCase = false;

let caseLookupData = {
    countries: [],
    states: [],
    cities: [],
    classifications: [],
    offenses: [],
    outcomes: []
};


/* -----------------------------------------
   BASIC HELPERS
   ----------------------------------------- */

function getElement(id) {

    return document.getElementById(id);

}


function setHidden(id, hidden) {

    const element = getElement(id);

    if (!element) {
        return;
    }

    element.style.display =
        hidden ? "none" : "";

}


function setText(id, text) {

    const element = getElement(id);

    if (!element) {
        return;
    }

    element.textContent =
        text || "";

}


function getValue(id) {

    const element = getElement(id);

    if (!element) {
        return "";
    }

    return element.value || "";

}


function normalizeValue(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


/* -----------------------------------------
   OFFENSE FORMATTING
   ----------------------------------------- */

function formatOffenseName(value) {

    const rawName =
        String(value || "").trim();

    if (!rawName) {
        return "";
    }

    return rawName
        .toLowerCase()
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        )
        .replace(
            /\b(And|Of|With|By|In|On|The|For|To|From|At)\b/g,
            word =>
                word.toLowerCase()
        );

}


/* -----------------------------------------
   OFFENSE SELECT CHECK
   ----------------------------------------- */

function isOffenseSelect(selectId) {

    return (
        selectId ===
            "case-offense-input" ||

        selectId ===
            "case-additional-offenses-input"
    );

}


/* -----------------------------------------
   SORTING
   ----------------------------------------- */

function sortByName(items) {

    return [...(items || [])].sort(
        (a, b) =>
            String(a.name || "").localeCompare(
                String(b.name || ""),
                undefined,
                {
                    sensitivity: "base"
                }
            )
    );

}


/* -----------------------------------------
   SELECT HELPERS
   ----------------------------------------- */

function clearSelect(
    selectId,
    placeholder
) {

    const select =
        getElement(selectId);

    if (!select) {
        return;
    }

    select.innerHTML = "";

    if (placeholder !== null) {

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent =
            placeholder;

        select.appendChild(option);

    }

}


/* -----------------------------------------
   POPULATE SIMPLE SELECT
   ----------------------------------------- */

function populateSimpleSelect(
    selectId,
    items,
    placeholder
) {

    const select =
        getElement(selectId);

    if (!select) {
        return;
    }

    clearSelect(
        selectId,
        placeholder
    );

    const sortedItems =
        sortByName(items);

    sortedItems.forEach(
        item => {

            const rawName =
                String(
                    item.name || ""
                ).trim();

            if (!rawName) {
                return;
            }

            const cleanName =
                isOffenseSelect(selectId)
                    ? formatOffenseName(rawName)
                    : rawName;

            if (!cleanName) {
                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                cleanName;

            option.textContent =
                cleanName;

            select.appendChild(
                option
            );

        }
    );

}


/* -----------------------------------------
   ENSURE OPTION EXISTS
   ----------------------------------------- */

function ensureOptionExists(
    selectId,
    value
) {

    const select =
        getElement(selectId);

    const cleanValue =
        String(value || "").trim();

    if (
        !select ||
        !cleanValue
    ) {

        return;

    }

    const exists =
        Array.from(
            select.options
        ).some(
            option =>
                normalizeValue(
                    option.value
                ) ===
                normalizeValue(
                    cleanValue
                )
        );

    if (exists) {
        return;
    }

    const displayValue =
        isOffenseSelect(selectId)
            ? formatOffenseName(cleanValue)
            : cleanValue;

    const option =
        document.createElement(
            "option"
        );

    option.value =
        displayValue;

    option.textContent =
        displayValue;

    select.appendChild(
        option
    );

}


/* -----------------------------------------
   SELECT VALUE
   ----------------------------------------- */

function selectValue(
    selectId,
    value
) {

    const select =
        getElement(selectId);

    const cleanValue =
        String(value || "").trim();

    if (!select) {
        return;
    }

    if (!cleanValue) {

        select.value = "";

        return;

    }

    ensureOptionExists(
        selectId,
        cleanValue
    );

    const matchingOption =
        Array.from(
            select.options
        ).find(
            option =>
                normalizeValue(
                    option.value
                ) ===
                normalizeValue(
                    cleanValue
                )
        );

    if (matchingOption) {

        select.value =
            matchingOption.value;

    } else {

        select.value = "";

    }

}


/* -----------------------------------------
   GET SELECTED VALUES
   ----------------------------------------- */

function getSelectedValues(
    selectId
) {

    const select =
        getElement(selectId);

    if (!select) {
        return [];
    }

    return Array.from(
        select.selectedOptions
    )
        .map(
            option =>
                option.value.trim()
        )
        .filter(Boolean);

}


/* -----------------------------------------
   ADDITIONAL CHARGES SUMMARY
   ----------------------------------------- */

function updateAdditionalChargesSummary() {

    const select =
        getElement(
            "case-additional-offenses-input"
        );

    if (!select) {
        return;
    }

    let summary =
        getElement(
            "additional-charges-summary"
        );

    if (!summary) {

        summary =
            document.createElement(
                "div"
            );

        summary.id =
            "additional-charges-summary";

        summary.className =
            "additional-charges-summary";

        select.insertAdjacentElement(
            "afterend",
            summary
        );

    }

    const selected =
        Array.from(
            select.selectedOptions
        )
            .map(
                option =>
                    option.textContent.trim()
            )
            .filter(Boolean);

    summary.innerHTML =
        "";

    const label =
        document.createElement(
            "span"
        );

    label.className =
        "additional-charges-summary-label";

    label.textContent =
        `Selected Charges (${selected.length})`;

    summary.appendChild(
        label
    );

    if (
        selected.length === 0
    ) {

        const none =
            document.createElement(
                "span"
            );

        none.className =
            "additional-charges-none";

        none.textContent =
            "No additional charges selected.";

        summary.appendChild(
            none
        );

        return;

    }

    selected.forEach(
        charge => {

            const tag =
                document.createElement(
                    "span"
                );

            tag.className =
                "additional-charge-tag";

            tag.textContent =
                charge;

            summary.appendChild(
                tag
            );

        }
    );

}


/* -----------------------------------------
   PARSE ADDITIONAL OFFENSES
   ----------------------------------------- */

function parseAdditionalOffenses(
    value
) {

    const raw =
        String(value || "").trim();

    if (!raw) {
        return [];
    }

    return raw
        .split(/\s*(?:,|;|\n)\s*/)
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


/* -----------------------------------------
   BUILD COMPLETE OFFENSE LIST
   ----------------------------------------- */

/*
   IMPORTANT:

   The Additional Offenses dropdown should
   contain EVERY offense known to CBRA.

   That includes:

   1. case_offenses
   2. primary offenses already used by cases
   3. additional offenses already stored
      in cases.additional_offenses

   This prevents older/additional offenses
   from disappearing simply because they
   weren't manually added to case_offenses.
*/

async function loadCompleteOffenseList() {

    const offenseMap =
        new Map();


    /* -------------------------------------
       OFFENSE LOOKUP TABLE
       ------------------------------------- */

    (caseLookupData.offenses || [])
        .forEach(
            offense => {

                const name =
                    String(
                        offense.name || ""
                    ).trim();

                if (!name) {
                    return;
                }

                offenseMap.set(
                    normalizeValue(name),
                    name
                );

            }
        );


    /* -------------------------------------
       ALL CASE PRIMARY + ADDITIONAL OFFENSES
       ------------------------------------- */

    const {
        data: cases,
        error
    } =
        await supabaseClient
            .from("cases")
            .select(
                `
                offense,
                additional_offenses
                `
            );


    if (error) {

        console.error(
            "Could not load offenses from cases:",
            error
        );

    } else {

        (cases || [])
            .forEach(
                caseItem => {

                    /* -------------------------
                       PRIMARY OFFENSE
                       ------------------------- */

                    const primary =
                        String(
                            caseItem.offense || ""
                        ).trim();

                    if (primary) {

                        offenseMap.set(
                            normalizeValue(primary),
                            primary
                        );

                    }


                    /* -------------------------
                       ADDITIONAL OFFENSES
                       ------------------------- */

                    const additional =
                        parseAdditionalOffenses(
                            caseItem.additional_offenses
                        );

                    additional.forEach(
                        offense => {

                            offenseMap.set(
                                normalizeValue(offense),
                                offense
                            );

                        }
                    );

                }
            );

    }


    /*
       Convert back into the same structure
       used by the dropdown system.
    */

    const completeOffenses =
        Array.from(
            offenseMap.values()
        )
            .map(
                name => ({
                    name
                })
            );


    caseLookupData.offenses =
        sortByName(
            completeOffenses
        );


    return caseLookupData.offenses;

}


/* -----------------------------------------
   LOGIN
   ----------------------------------------- */

async function loginUser(event) {

    event.preventDefault();

    const email =
        getValue(
            "login-email"
        ).trim();

    const password =
        getValue(
            "login-password"
        );

    setText(
        "login-message",
        "Logging in..."
    );

    const {
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({
                email,
                password
            });

    if (error) {

        console.error(
            "Login error:",
            error
        );

        setText(
            "login-message",
            error.message
        );

        return;

    }

    setText(
        "login-message",
        ""
    );

}


/* -----------------------------------------
   LOGOUT
   ----------------------------------------- */

async function logoutUser() {

    const {
        error
    } =
        await supabaseClient.auth
            .signOut();

    if (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


/* -----------------------------------------
   CHECK LOGIN
   ----------------------------------------- */

async function checkLogin() {

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();

    if (error) {

        console.error(
            "Session error:",
            error
        );

        return;

    }

    const session =
        data?.session;

    if (session) {

        setHidden(
            "login-section",
            true
        );

        setHidden(
            "management-content",
            false
        );

        await loadCaseLookups();

        await loadCaseList();

        const selector =
            getElement(
                "case-selector"
            );

        if (
            selector &&
            selector.value
        ) {

            await loadCase(
                selector.value
            );

        }

    } else {

        setHidden(
            "login-section",
            false
        );

        setHidden(
            "management-content",
            true
        );

    }

}


/* -----------------------------------------
   LOAD ALL CASE LOOKUPS
   ----------------------------------------- */

async function loadCaseLookups() {

    console.log(
        "Loading CBRA case lookup tables..."
    );


    /* -------------------------------------
       COUNTRIES
       ------------------------------------- */

    const {
        data: countries,
        error: countriesError
    } =
        await supabaseClient
            .from("case_countries")
            .select(
                "id, name"
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );

    if (countriesError) {

        console.error(
            "Could not load countries:",
            countriesError
        );

    } else {

        caseLookupData.countries =
            countries || [];

    }


    /* -------------------------------------
       STATES
       ------------------------------------- */

    const {
        data: states,
        error: statesError
    } =
        await supabaseClient
            .from("case_states")
            .select(
                "id, country_id, name"
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );

    if (statesError) {

        console.error(
            "Could not load states:",
            statesError
        );

    } else {

        caseLookupData.states =
            states || [];

    }


    /* -------------------------------------
       CITIES
       ------------------------------------- */

    const {
        data: cities,
        error: citiesError
    } =
        await supabaseClient
            .from("case_cities")
            .select(
                "id, state_id, name"
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );

    if (citiesError) {

        console.error(
            "Could not load cities:",
            citiesError
        );

    } else {

        caseLookupData.cities =
            cities || [];

    }


    /* -------------------------------------
       CLASSIFICATIONS
       ------------------------------------- */

    const {
        data: classifications,
        error: classificationsError
    } =
        await supabaseClient
            .from("case_classifications")
            .select(
                "id, name"
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );

    if (classificationsError) {

        console.error(
            "Could not load classifications:",
            classificationsError
        );

    } else {

        caseLookupData.classifications =
            classifications || [];

    }


    /* -------------------------------------
       OFFENSES
       ------------------------------------- */

    const {
        data: offenses,
        error: offensesError
    } =
        await supabaseClient
            .from("case_offenses")
            .select(
                "id, name"
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );

    if (offensesError) {

        console.error(
            "Could not load offenses:",
            offensesError
        );

    } else {

        caseLookupData.offenses =
            offenses || [];

    }


    /* -------------------------------------
       OUTCOMES
       ------------------------------------- */

    const {
        data: outcomes,
        error: outcomesError
    } =
        await supabaseClient
            .from("case_outcomes")
            .select(
                "id, name"
            )
            .order(
                "name",
                {
                    ascending: true
                }
            );

    if (outcomesError) {

        console.error(
            "Could not load outcomes:",
        outcomesError
        );

    } else {

        caseLookupData.outcomes =
            outcomes || [];

    }


    /* -------------------------------------
       BUILD COMPLETE OFFENSE LIST
       ------------------------------------- */

    await loadCompleteOffenseList();


    /* -------------------------------------
       POPULATE GLOBAL DROPDOWNS
       ------------------------------------- */

    populateSimpleSelect(
        "case-country-input",
        caseLookupData.countries,
        "-- Select Country --"
    );

    populateSimpleSelect(
        "case-classification-input",
        caseLookupData.classifications,
        "-- Select Classification --"
    );

    populateSimpleSelect(
        "case-offense-input",
        caseLookupData.offenses,
        "-- Select Primary Offense --"
    );

    populateSimpleSelect(
        "case-additional-offenses-input",
        caseLookupData.offenses,
        null
    );


    updateAdditionalChargesSummary();


    populateSimpleSelect(
        "case-outcome-input",
        caseLookupData.outcomes,
        "-- Select Outcome --"
    );


    clearSelect(
        "case-state-input",
        "-- Select State / Province --"
    );

    clearSelect(
        "case-city-input",
        "-- Select City --"
    );


    console.log(
        "CBRA lookup data loaded:",
        {
            countries:
                caseLookupData.countries.length,

            states:
                caseLookupData.states.length,

            cities:
                caseLookupData.cities.length,

            classifications:
                caseLookupData.classifications.length,

            offenses:
                caseLookupData.offenses.length,

            outcomes:
                caseLookupData.outcomes.length
        }
    );

}


/* -----------------------------------------
   POPULATE STATES FOR COUNTRY
   ----------------------------------------- */

function populateStatesForCountry(
    countryId,
    selectedValue = ""
) {

    const matchingStates =
        caseLookupData.states
            .filter(
                state =>
                    String(
                        state.country_id
                    ) ===
                    String(
                        countryId
                    )
            );

    const sortedStates =
        sortByName(
            matchingStates
        );

    populateSimpleSelect(
        "case-state-input",
        sortedStates,
        "-- Select State / Province --"
    );

    clearSelect(
        "case-city-input",
        "-- Select City --"
    );

    if (!selectedValue) {
        return;
    }

    selectValue(
        "case-state-input",
        selectedValue
    );

    const selectedState =
        sortedStates.find(
            state =>
                normalizeValue(
                    state.name
                ) ===
                normalizeValue(
                    selectedValue
                )
        );

    if (!selectedState) {
        return;
    }

    populateCitiesForState(
        selectedState.id
    );

}


/* -----------------------------------------
   POPULATE CITIES FOR STATE
   ----------------------------------------- */

function populateCitiesForState(
    stateId,
    selectedValue = ""
) {

    const matchingCities =
        caseLookupData.cities
            .filter(
                city =>
                    String(
                        city.state_id
                    ) ===
                    String(
                        stateId
                    )
            );

    const sortedCities =
        sortByName(
            matchingCities
        );

    populateSimpleSelect(
        "case-city-input",
        sortedCities,
        "-- Select City --"
    );

    if (selectedValue) {

        selectValue(
            "case-city-input",
            selectedValue
        );

    }

}


/* -----------------------------------------
   ADD SIMPLE LOOKUP VALUE
   ----------------------------------------- */

async function addSimpleLookupValue(
    tableName,
    value,
    lookupProperty,
    selectId,
    placeholder
) {

    const cleanValue =
        String(value || "").trim();

    if (!cleanValue) {

        alert(
            "Please enter a name."
        );

        return null;

    }


    const existing =
        caseLookupData[
            lookupProperty
        ].find(
            item =>
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    cleanValue
                )
        );

    if (existing) {

        populateSimpleSelect(
            selectId,
            caseLookupData[
                lookupProperty
            ],
            placeholder
        );

        selectValue(
            selectId,
            existing.name
        );

        alert(
            `"${existing.name}" already exists.`
        );

        return existing;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(tableName)
            .insert({
                name:
                    cleanValue
            })
            .select(
                "id, name"
            )
            .single();

    if (error) {

        console.error(
            `Error adding ${tableName}:`,
            error
        );

        alert(
            `Could not add "${cleanValue}".\n\n${error.message}`
        );

        return null;

    }


    caseLookupData[
        lookupProperty
    ].push(
        data
    );


    caseLookupData[
        lookupProperty
    ] =
        sortByName(
            caseLookupData[
                lookupProperty
            ]
        );


    populateSimpleSelect(
        selectId,
        caseLookupData[
            lookupProperty
        ],
        placeholder
    );


    selectValue(
        selectId,
        data.name
    );


    if (
        selectId ===
        "case-offense-input"
    ) {

        await loadCompleteOffenseList();

        populateSimpleSelect(
            "case-offense-input",
            caseLookupData.offenses,
            "-- Select Primary Offense --"
        );

        populateSimpleSelect(
            "case-additional-offenses-input",
            caseLookupData.offenses,
            null
        );

        updateAdditionalChargesSummary();

    }


    return data;

}


/* -----------------------------------------
   ADD COUNTRY
   ----------------------------------------- */

async function addCountry() {

    const value =
        prompt(
            "Enter the new country name:"
        );

    if (value === null) {
        return;
    }

    await addSimpleLookupValue(
        "case_countries",
        value,
        "countries",
        "case-country-input",
        "-- Select Country --"
    );

}


/* -----------------------------------------
   ADD STATE / PROVINCE
   ----------------------------------------- */

async function addState() {

    const countryName =
        getValue(
            "case-country-input"
        ).trim();

    if (!countryName) {

        alert(
            "Select a country first."
        );

        return;

    }

    const country =
        caseLookupData.countries.find(
            item =>
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    countryName
                )
        );

    if (!country) {

        alert(
            "The selected country could not be found."
        );

        return;

    }

    const value =
        prompt(
            `Enter the new state/province for ${country.name}:`
        );

    if (value === null) {
        return;
    }

    const cleanValue =
        value.trim();

    if (!cleanValue) {

        alert(
            "Please enter a state/province name."
        );

        return;

    }

    const existing =
        caseLookupData.states.find(
            state =>
                String(
                    state.country_id
                ) ===
                String(
                    country.id
                ) &&
                normalizeValue(
                    state.name
                ) ===
                normalizeValue(
                    cleanValue
                )
        );

    if (existing) {

        populateStatesForCountry(
            country.id
        );

        selectValue(
            "case-state-input",
            existing.name
        );

        alert(
            `"${existing.name}" already exists for ${country.name}.`
        );

        return;

    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_states")
            .insert({
                country_id:
                    country.id,
                name:
                    cleanValue
            })
            .select(
                "id, country_id, name"
            )
            .single();

    if (error) {

        console.error(
            "Error adding state/province:",
            error
        );

        alert(
            `Could not add "${cleanValue}".\n\n${error.message}`
        );

        return;

    }

    caseLookupData.states.push(
        data
    );

    populateStatesForCountry(
        country.id
    );

    selectValue(
        "case-state-input",
        data.name
    );

}


/* -----------------------------------------
   ADD CITY
   ----------------------------------------- */

async function addCity() {

    const countryName =
        getValue(
            "case-country-input"
        ).trim();

    const stateName =
        getValue(
            "case-state-input"
        ).trim();

    if (!countryName) {

        alert(
            "Select a country first."
        );

        return;

    }

    if (!stateName) {

        alert(
            "Select a state/province first."
        );

        return;

    }

    const country =
        caseLookupData.countries.find(
            item =>
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    countryName
                )
        );

    if (!country) {

        alert(
            "The selected country could not be found."
        );

        return;

    }

    const state =
        caseLookupData.states.find(
            item =>
                String(
                    item.country_id
                ) ===
                String(
                    country.id
                ) &&
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    stateName
                )
        );

    if (!state) {

        alert(
            "The selected state/province could not be found."
        );

        return;

    }

    const value =
        prompt(
            `Enter the new city for ${state.name}, ${country.name}:`
        );

    if (value === null) {
        return;
    }

    const cleanValue =
        value.trim();

    if (!cleanValue) {

        alert(
            "Please enter a city name."
        );

        return;

    }

    const existing =
        caseLookupData.cities.find(
            city =>
                String(
                    city.state_id
                ) ===
                String(
                    state.id
                ) &&
                normalizeValue(
                    city.name
                ) ===
                normalizeValue(
                    cleanValue
                )
        );

    if (existing) {

        populateCitiesForState(
            state.id
        );

        selectValue(
            "case-city-input",
            existing.name
        );

        alert(
            `"${existing.name}" already exists for ${state.name}.`
        );

        return;

    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_cities")
            .insert({
                state_id:
                    state.id,
                name:
                    cleanValue
            })
            .select(
                "id, state_id, name"
            )
            .single();

    if (error) {

        console.error(
            "Error adding city:",
            error
        );

        alert(
            `Could not add "${cleanValue}".\n\n${error.message}`
        );

        return;

    }

    caseLookupData.cities.push(
        data
    );

    populateCitiesForState(
        state.id
    );

    selectValue(
        "case-city-input",
        data.name
    );

}


/* -----------------------------------------
   ADD CLASSIFICATION
   ----------------------------------------- */

async function addClassification() {

    const value =
        prompt(
            "Enter the new classification:"
        );

    if (value === null) {
        return;
    }

    await addSimpleLookupValue(
        "case_classifications",
        value,
        "classifications",
        "case-classification-input",
        "-- Select Classification --"
    );

}


/* -----------------------------------------
   ADD OFFENSE
   ----------------------------------------- */

async function addOffense() {

    const value =
        prompt(
            "Enter the new offense:"
        );

    if (value === null) {
        return;
    }

    const newOffense =
        await addSimpleLookupValue(
            "case_offenses",
            value,
            "offenses",
            "case-offense-input",
            "-- Select Primary Offense --"
        );

    if (!newOffense) {
        return;
    }

    await loadCompleteOffenseList();

    populateSimpleSelect(
        "case-offense-input",
        caseLookupData.offenses,
        "-- Select Primary Offense --"
    );

    populateSimpleSelect(
        "case-additional-offenses-input",
        caseLookupData.offenses,
        null
    );

    selectValue(
        "case-offense-input",
        newOffense.name
    );

    updateAdditionalChargesSummary();

}


/* -----------------------------------------
   ADD ADDITIONAL OFFENSE
   ----------------------------------------- */

async function addAdditionalOffense() {

    const value =
        prompt(
            "Enter the new offense:"
        );

    if (value === null) {
        return;
    }

    const cleanValue =
        value.trim();

    if (!cleanValue) {

        alert(
            "Please enter an offense name."
        );

        return;

    }

    const existing =
        caseLookupData.offenses.find(
            item =>
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    cleanValue
                )
        );

    if (existing) {

        populateSimpleSelect(
            "case-additional-offenses-input",
            caseLookupData.offenses,
            null
        );

        const additionalSelect =
            getElement(
                "case-additional-offenses-input"
            );

        if (additionalSelect) {

            Array.from(
                additionalSelect.options
            ).forEach(
                option => {

                    if (
                        normalizeValue(
                            option.value
                        ) ===
                        normalizeValue(
                            existing.name
                        )
                    ) {

                        option.selected =
                            true;

                    }

                }
            );

        }

        updateAdditionalChargesSummary();

        alert(
            `"${existing.name}" already exists.`
        );

        return;

    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_offenses")
            .insert({
                name:
                    cleanValue
            })
            .select(
                "id, name"
            )
            .single();

    if (error) {

        console.error(
            "Error adding additional offense:",
            error
        );

        alert(
            `Could not add "${cleanValue}".\n\n${error.message}`
        );

        return;

    }

    caseLookupData.offenses.push(
        data
    );

    await loadCompleteOffenseList();

    populateSimpleSelect(
        "case-offense-input",
        caseLookupData.offenses,
        "-- Select Primary Offense --"
    );

    populateSimpleSelect(
        "case-additional-offenses-input",
        caseLookupData.offenses,
        null
    );

    const additionalSelect =
        getElement(
            "case-additional-offenses-input"
        );

    if (additionalSelect) {

        Array.from(
            additionalSelect.options
        ).forEach(
            option => {

                if (
                    normalizeValue(
                        option.value
                    ) ===
                    normalizeValue(
                        data.name
                    )
                ) {

                    option.selected =
                        true;

                }

            }
        );

    }

    updateAdditionalChargesSummary();

}


/* -----------------------------------------
   ADD OUTCOME
   ----------------------------------------- */

async function addOutcome() {

    const value =
        prompt(
            "Enter the new outcome:"
        );

    if (value === null) {
        return;
    }

    await addSimpleLookupValue(
        "case_outcomes",
        value,
        "outcomes",
        "case-outcome-input",
        "-- Select Outcome --"
    );

}


/* -----------------------------------------
   CASE LIST
   ----------------------------------------- */

async function loadCaseList() {

    const selector =
        getElement(
            "case-selector"
        );

    if (!selector) {
        return;
    }

    const previousValue =
        selector.value;

    const {
        data,
        error
    } =
        await supabaseClient
            .from("cases")
            .select(
                "id, case_name, case_date"
            );

    if (error) {

        console.error(
            "Error loading cases:",
            error
        );

        setText(
            "case-selector-message",
            `Could not load cases: ${error.message}`
        );

        return;

    }

    const sortedCases =
        [...(data || [])].sort(
            (a, b) =>
                String(
                    a.case_name ||
                    "Unnamed Case"
                )
                    .trim()
                    .localeCompare(
                        String(
                            b.case_name ||
                            "Unnamed Case"
                        )
                            .trim(),
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    )
        );

    selector.innerHTML =
        "";

    const placeholder =
        document.createElement(
            "option"
        );

    placeholder.value =
        "";

    placeholder.textContent =
        "-- Select Case --";

    selector.appendChild(
        placeholder
    );

    sortedCases.forEach(
        caseItem => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                caseItem.id;

            let label =
                caseItem.case_name ||
                "Unnamed Case";

            if (
                caseItem.case_date
            ) {

                label +=
                    ` — ${caseItem.case_date}`;

            }

            option.textContent =
                label;

            selector.appendChild(
                option
            );

        }
    );

    if (
        previousValue &&
        Array.from(
            selector.options
        ).some(
            option =>
                option.value ===
                String(
                    previousValue
                )
        )
    ) {

        selector.value =
            previousValue;

    }

    setText(
        "case-selector-message",
        ""
    );

}


/* -----------------------------------------
   LOAD CASE
   ----------------------------------------- */

async function loadCase(
    caseId
) {

    if (!caseId) {
        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("cases")
            .select(
                `
                id,
                case_name,
                case_date,
                country,
                state_province,
                city,
                classification,
                offense,
                additional_offenses,
                outcome,
                victim_count,
                fatality_count,
                description
                `
            )
            .eq(
                "id",
                caseId
            )
            .single();

    if (error) {

        console.error(
            "Error loading case:",
            error
        );

        setText(
            "case-message",
            `Could not load case: ${error.message}`
        );

        return;

    }

    isCreatingNewCase =
        false;

    setText(
        "case-message",
        ""
    );


    /* -------------------------------------
       BASIC CASE INFORMATION
       ------------------------------------- */

    const nameInput =
        getElement(
            "case-name-input"
        );

    if (nameInput) {

        nameInput.value =
            data.case_name || "";

    }

    const dateInput =
        getElement(
            "case-date-input"
        );

    if (dateInput) {

        dateInput.value =
            data.case_date || "";

    }


    /* -------------------------------------
       COUNTRY
       ------------------------------------- */

    selectValue(
        "case-country-input",
        data.country
    );

    const country =
        caseLookupData.countries.find(
            item =>
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    data.country
                )
        );


    /* -------------------------------------
       STATE / CITY
       ------------------------------------- */

    if (country) {

        populateStatesForCountry(
            country.id,
            data.state_province
        );

        if (data.city) {

            selectValue(
                "case-city-input",
                data.city
            );

        }

    } else {

        ensureOptionExists(
            "case-country-input",
            data.country
        );

        selectValue(
            "case-country-input",
            data.country
        );

        clearSelect(
            "case-state-input",
            "-- Select State / Province --"
        );

        clearSelect(
            "case-city-input",
            "-- Select City --"
        );

        if (data.state_province) {

            ensureOptionExists(
                "case-state-input",
                data.state_province
            );

            selectValue(
                "case-state-input",
                data.state_province
            );

        }

        if (data.city) {

            ensureOptionExists(
                "case-city-input",
                data.city
            );

            selectValue(
                "case-city-input",
                data.city
            );

        }

    }


    /* -------------------------------------
       CLASSIFICATION
       ------------------------------------- */

    selectValue(
        "case-classification-input",
        data.classification
    );


    /* -------------------------------------
       PRIMARY OFFENSE
       ------------------------------------- */

    selectValue(
        "case-offense-input",
        data.offense
    );


    /* -------------------------------------
       ADDITIONAL OFFENSES
       ------------------------------------- */

    const additionalOffenses =
        parseAdditionalOffenses(
            data.additional_offenses
        );

    const additionalSelect =
        getElement(
            "case-additional-offenses-input"
        );

    if (additionalSelect) {

        /*
           Rebuild using the COMPLETE offense
           list from all sources.
        */

        await loadCompleteOffenseList();

        populateSimpleSelect(
            "case-additional-offenses-input",
            caseLookupData.offenses,
            null
        );


        /*
           Make absolutely sure every offense
           already saved on this case exists.
        */

        additionalOffenses.forEach(
            offense => {

                ensureOptionExists(
                    "case-additional-offenses-input",
                    offense
                );

            }
        );


        /*
           Select the saved offenses.
        */

        Array.from(
            additionalSelect.options
        ).forEach(
            option => {

                option.selected =
                    additionalOffenses.some(
                        offense =>
                            normalizeValue(
                                offense
                            ) ===
                            normalizeValue(
                                option.value
                            )
                    );

            }
        );


        updateAdditionalChargesSummary();

    }


    /* -------------------------------------
       OUTCOME
       ------------------------------------- */

    selectValue(
        "case-outcome-input",
        data.outcome
    );


    /* -------------------------------------
       VICTIM COUNT
       ------------------------------------- */

    const victimInput =
        getElement(
            "case-victims-input"
        );

    if (victimInput) {

        victimInput.value =
            data.victim_count ?? "";

    }


    /* -------------------------------------
       FATALITY COUNT
       ------------------------------------- */

    const fatalityInput =
        getElement(
            "case-fatalities-input"
        );

    if (fatalityInput) {

        fatalityInput.value =
            data.fatality_count ?? "";

    }


    /* -------------------------------------
       DESCRIPTION
       ------------------------------------- */

    const descriptionInput =
        getElement(
            "case-description-input"
        );

    if (descriptionInput) {

        descriptionInput.value =
            data.description || "";

    }


    /* -------------------------------------
       PUBLIC CASE LINK
       ------------------------------------- */

    const publicLink =
        getElement(
            "public-case-link"
        );

    if (publicLink) {

        publicLink.href =
            `case.html?id=${encodeURIComponent(
                caseId
            )}`;

    }


    /* -------------------------------------
       CONNECTED CASE DATA
       ------------------------------------- */

    await loadCaseManagementData(
        caseId
    );

}


/* -----------------------------------------
   CLEAR CASE FORM
   ----------------------------------------- */

function clearCaseForm() {

    const fields = [

        "case-name-input",
        "case-date-input",
        "case-victims-input",
        "case-fatalities-input",
        "case-description-input"

    ];

    fields.forEach(
        id => {

            const element =
                getElement(id);

            if (element) {

                element.value =
                    "";

            }

        }
    );


    const countrySelect =
        getElement(
            "case-country-input"
        );

    if (countrySelect) {

        countrySelect.value =
            "";

    }


    clearSelect(
        "case-state-input",
        "-- Select State / Province --"
    );

    clearSelect(
        "case-city-input",
        "-- Select City --"
    );


    const classificationSelect =
        getElement(
            "case-classification-input"
        );

    if (classificationSelect) {

        classificationSelect.value =
            "";

    }


    const offenseSelect =
        getElement(
            "case-offense-input"
        );

    if (offenseSelect) {

        offenseSelect.value =
            "";

    }


    const additionalSelect =
        getElement(
            "case-additional-offenses-input"
        );

    if (additionalSelect) {

        Array.from(
            additionalSelect.options
        ).forEach(
            option => {

                option.selected =
                    false;

            }
        );

    }


    updateAdditionalChargesSummary();


    const outcomeSelect =
        getElement(
            "case-outcome-input"
        );

    if (outcomeSelect) {

        outcomeSelect.value =
            "";

    }


    setText(
        "case-message",
        ""
    );


    const publicLink =
        getElement(
            "public-case-link"
        );

    if (publicLink) {

        publicLink.href =
            "#";

    }

}


/* -----------------------------------------
   GET CURRENT CASE ID
   ----------------------------------------- */

function getCurrentCaseId() {

    const selector =
        getElement(
            "case-selector"
        );

    if (!selector) {
        return null;
    }

    return selector.value || null;

}


/* -----------------------------------------
   START NEW CASE
   ----------------------------------------- */

async function startNewCase() {

    isCreatingNewCase =
        true;

    const selector =
        getElement(
            "case-selector"
        );

    if (selector) {

        selector.value =
            "";

    }

    clearCaseForm();


    if (
        caseLookupData.countries.length === 0
    ) {

        await loadCaseLookups();

    }


    clearManagementSections();


    setText(
        "case-selector-message",
        "Creating a new case."
    );


    const newCaseButton =
        getElement(
            "new-case-button"
        );

    if (newCaseButton) {

        newCaseButton.textContent =
            "Cancel New Case";

    }

}


/* -----------------------------------------
   CANCEL NEW CASE
   ----------------------------------------- */

async function cancelNewCase() {

    isCreatingNewCase =
        false;

    const newCaseButton =
        getElement(
            "new-case-button"
        );

    if (newCaseButton) {

        newCaseButton.textContent =
            "+ Add New Case";

    }

    setText(
        "case-selector-message",
        ""
    );

    clearCaseForm();

    const selector =
        getElement(
            "case-selector"
        );

    if (
        selector &&
        selector.value
    ) {

        await loadCase(
            selector.value
        );

    } else {

        clearManagementSections();

    }

}


/* -----------------------------------------
   CLEAR MANAGEMENT SECTIONS
   ----------------------------------------- */

function clearManagementSections() {

    const sectionIds = [

        "case-people-list",
        "crime-tag-list",
        "influence-tag-list",
        "mental-health-tag-list",
        "demographic-tag-list",
        "crime-scene-photo-list",
        "media-list",
        "documents-management",
        "source-list",
        "link-list",
        "related-case-list"

    ];

    sectionIds.forEach(
        id => {

            const element =
                getElement(id);

            if (!element) {
                return;
            }

            element.innerHTML =
                `
                <p class="empty-message">
                    Select a case to view this information.
                </p>
                `;

        }
    );

}


/* -----------------------------------------
   GET CASE DATA
   ----------------------------------------- */

function getCaseData() {

    const additionalOffenses =
        getSelectedValues(
            "case-additional-offenses-input"
        );

    return {

        case_name:
            getValue(
                "case-name-input"
            ).trim(),

        case_date:
            getValue(
                "case-date-input"
            ) || null,

        country:
            getValue(
                "case-country-input"
            ).trim() || null,

        state_province:
            getValue(
                "case-state-input"
            ).trim() || null,

        city:
            getValue(
                "case-city-input"
            ).trim() || null,

        classification:
            getValue(
                "case-classification-input"
            ).trim() || null,

        offense:
            getValue(
                "case-offense-input"
            ).trim() || null,

        additional_offenses:
            additionalOffenses.length > 0
                ? additionalOffenses.join("; ")
                : null,

        outcome:
            getValue(
                "case-outcome-input"
            ).trim() || null,

        victim_count:
            getValue(
                "case-victims-input"
            ) !== ""
                ? Number(
                    getValue(
                        "case-victims-input"
                    )
                )
                : null,

        fatality_count:
            getValue(
                "case-fatalities-input"
            ) !== ""
                ? Number(
                    getValue(
                        "case-fatalities-input"
                    )
                )
                : null,

        description:
            getValue(
                "case-description-input"
            ).trim() || null

    };

}


/* -----------------------------------------
   UPDATE EXISTING CASE
   ----------------------------------------- */

async function updateExistingCase(
    caseId,
    caseData
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("cases")
            .update(
                caseData
            )
            .eq(
                "id",
                caseId
            )
            .select()
            .single();

    if (error) {

        console.error(
            "Error updating case:",
            error
        );

        setText(
            "case-message",
            `Could not save case: ${error.message}`
        );

        return null;

    }

    setText(
        "case-message",
        "Case saved successfully."
    );

    return data;

}


/* -----------------------------------------
   CREATE NEW CASE
   ----------------------------------------- */

async function createNewCase(
    caseData
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("cases")
            .insert(
                caseData
            )
            .select()
            .single();

    if (error) {

        console.error(
            "Error creating case:",
            error
        );

        setText(
            "case-message",
            `Could not create case: ${error.message}`
        );

        return null;

    }

    setText(
        "case-message",
        "New case created successfully."
    );

    return data;

}


/* -----------------------------------------
   SAVE CASE
   ----------------------------------------- */

async function saveCase(
    event
) {

    if (event) {

        event.preventDefault();

    }

    const caseData =
        getCaseData();

    if (!caseData.case_name) {

        setText(
            "case-message",
            "Please enter a case name."
        );

        return;

    }


    /* -------------------------------------
       CREATE NEW CASE
       ------------------------------------- */

    if (isCreatingNewCase) {

        setText(
            "case-message",
            "Creating case..."
        );

        const newCase =
            await createNewCase(
                caseData
            );

        if (!newCase) {
            return;
        }

        isCreatingNewCase =
            false;

        const newCaseButton =
            getElement(
                "new-case-button"
            );

        if (newCaseButton) {

            newCaseButton.textContent =
                "+ Add New Case";

        }

        await loadCaseList();

        const selector =
            getElement(
                "case-selector"
            );

        if (selector) {

            selector.value =
                newCase.id;

        }

        await loadCase(
            newCase.id
        );

        setText(
            "case-selector-message",
            "New case created."
        );

        return;

    }


    /* -------------------------------------
       UPDATE EXISTING CASE
       ------------------------------------- */

    const caseId =
        getCurrentCaseId();

    if (!caseId) {

        setText(
            "case-message",
            "Select a case or click + Add New Case."
        );

        return;

    }

    setText(
        "case-message",
        "Saving case..."
    );

    const updatedCase =
        await updateExistingCase(
            caseId,
            caseData
        );

    if (!updatedCase) {
        return;
    }

    await loadCaseList();

    const selector =
        getElement(
            "case-selector"
        );

    if (selector) {

        selector.value =
            caseId;

    }

}


/* -----------------------------------------
   LOAD CASE MANAGEMENT DATA
   ----------------------------------------- */

async function loadCaseManagementData(
    caseId
) {

    if (!caseId) {

        clearManagementSections();

        return;

    }


    /* -------------------------------------
       PEOPLE
       ------------------------------------- */

    if (
        typeof window.loadPeopleSelector ===
        "function"
    ) {

        try {

            await window.loadPeopleSelector(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading people selector:",
                error
            );

        }

    }


    if (
        typeof window.loadPeople ===
        "function"
    ) {

        try {

            await window.loadPeople(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading people:",
                error
            );

        }

    }


    /* -------------------------------------
       TAGS
       ------------------------------------- */

    if (
        typeof window.loadTags ===
        "function"
    ) {

        try {

            await window.loadTags(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading tags:",
                error
            );

        }

    }


    /* -------------------------------------
       SOURCES
       ------------------------------------- */

    if (
        typeof window.loadSources ===
        "function"
    ) {

        try {

            await window.loadSources(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading sources:",
                error
            );

        }

    }


    /* -------------------------------------
       CRIME SCENE PHOTO SOURCES
       ------------------------------------- */

    if (
        typeof window.loadCrimeScenePhotoSources ===
        "function"
    ) {

        try {

            await window.loadCrimeScenePhotoSources(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading crime scene photo sources:",
                error
            );

        }

    }


    /* -------------------------------------
       CRIME SCENE PHOTOS
       ------------------------------------- */

    if (
        typeof window.loadCrimeScenePhotos ===
        "function"
    ) {

        try {

            await window.loadCrimeScenePhotos(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading crime scene photos:",
                error
            );

        }

    }


    /* -------------------------------------
       MEDIA SOURCES
       ------------------------------------- */

    if (
        typeof window.loadMediaSources ===
        "function"
    ) {

        try {

            await window.loadMediaSources(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading media sources:",
                error
            );

        }

    }


    /* -------------------------------------
       MEDIA
       ------------------------------------- */

    if (
        typeof window.loadMedia ===
        "function"
    ) {

        try {

            await window.loadMedia(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading media:",
                error
            );

        }

    }


    /* -------------------------------------
       DOCUMENTS
       ------------------------------------- */

    if (
        typeof window.loadDocuments ===
        "function"
    ) {

        try {

            await window.loadDocuments(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading documents:",
                error
            );

        }

    }


    /* -------------------------------------
       LINKS
       ------------------------------------- */

    if (
        typeof window.loadLinks ===
        "function"
    ) {

        try {

            await window.loadLinks(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading links:",
                error
            );

        }

    }


    /* -------------------------------------
       RELATED CASES
       ------------------------------------- */

    if (
        typeof window.loadRelatedCaseOptions ===
        "function"
    ) {

        try {

            await window.loadRelatedCaseOptions(
                caseId
            );

        } catch (error) {

            console.error(
                "Error loading related case options:",
                error
            );

        }

    }

}


/* -----------------------------------------
   COUNTRY CHANGE
   ----------------------------------------- */

async function handleCountryChange() {

    const countryName =
        getValue(
            "case-country-input"
        ).trim();

    clearSelect(
        "case-state-input",
        "-- Select State / Province --"
    );

    clearSelect(
        "case-city-input",
        "-- Select City --"
    );

    if (!countryName) {
        return;
    }

    const country =
        caseLookupData.countries.find(
            item =>
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    countryName
                )
        );

    if (!country) {
        return;
    }

    populateStatesForCountry(
        country.id
    );

}


/* -----------------------------------------
   STATE CHANGE
   ----------------------------------------- */

async function handleStateChange() {

    const countryName =
        getValue(
            "case-country-input"
        ).trim();

    const stateName =
        getValue(
            "case-state-input"
        ).trim();

    clearSelect(
        "case-city-input",
        "-- Select City --"
    );

    if (
        !countryName ||
        !stateName
    ) {

        return;

    }

    const country =
        caseLookupData.countries.find(
            item =>
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    countryName
                )
        );

    if (!country) {
        return;
    }

    const state =
        caseLookupData.states.find(
            item =>
                String(
                    item.country_id
                ) ===
                String(
                    country.id
                ) &&
                normalizeValue(
                    item.name
                ) ===
                normalizeValue(
                    stateName
                )
        );

    if (!state) {
        return;
    }

    populateCitiesForState(
        state.id
    );

}


/* -----------------------------------------
   DOM CONTENT LOADED
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "CBRA Manage Cases initialized."
        );


        /* ---------------------------------
           LOGIN
           --------------------------------- */

        const loginForm =
            getElement(
                "login-form"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                loginUser
            );

        }


        /* ---------------------------------
           CASE FORM
           --------------------------------- */

        const caseForm =
            getElement(
                "case-form"
            );

        if (caseForm) {

            caseForm.addEventListener(
                "submit",
                saveCase
            );

        }


        /* ---------------------------------
           NEW CASE BUTTON
           --------------------------------- */

        const newCaseButton =
            getElement(
                "new-case-button"
            );

        if (newCaseButton) {

            newCaseButton.addEventListener(
                "click",
                async () => {

                    if (
                        isCreatingNewCase
                    ) {

                        await cancelNewCase();

                    } else {

                        await startNewCase();

                    }

                }
            );

        }


        /* ---------------------------------
           CASE SELECTOR
           --------------------------------- */

        const caseSelector =
            getElement(
                "case-selector"
            );

        if (caseSelector) {

            caseSelector.addEventListener(
                "change",
                async () => {

                    const caseId =
                        caseSelector.value;

                    isCreatingNewCase =
                        false;

                    const button =
                        getElement(
                            "new-case-button"
                        );

                    if (button) {

                        button.textContent =
                            "+ Add New Case";

                    }

                    if (!caseId) {

                        clearCaseForm();

                        clearManagementSections();

                        return;

                    }

                    await loadCase(
                        caseId
                    );

                }
            );

        }


        /* ---------------------------------
           COUNTRY
           --------------------------------- */

        const countrySelect =
            getElement(
                "case-country-input"
            );

        if (countrySelect) {

            countrySelect.addEventListener(
                "change",
                handleCountryChange
            );

        }


        /* ---------------------------------
           STATE
           --------------------------------- */

        const stateSelect =
            getElement(
                "case-state-input"
            );

        if (stateSelect) {

            stateSelect.addEventListener(
                "change",
                handleStateChange
            );

        }


        /* ---------------------------------
           ADDITIONAL CHARGES
           --------------------------------- */

        const additionalChargesSelect =
            getElement(
                "case-additional-offenses-input"
            );

        if (additionalChargesSelect) {

            additionalChargesSelect.addEventListener(
                "change",
                updateAdditionalChargesSummary
            );

        }


        /* ---------------------------------
           ADD COUNTRY
           --------------------------------- */

        const addCountryButton =
            getElement(
                "add-country-button"
            );

        if (addCountryButton) {

            addCountryButton.addEventListener(
                "click",
                addCountry
            );

        }


        /* ---------------------------------
           ADD STATE
           --------------------------------- */

        const addStateButton =
            getElement(
                "add-state-button"
            );

        if (addStateButton) {

            addStateButton.addEventListener(
                "click",
                addState
            );

        }


        /* ---------------------------------
           ADD CITY
           --------------------------------- */

        const addCityButton =
            getElement(
                "add-city-button"
            );

        if (addCityButton) {

            addCityButton.addEventListener(
                "click",
                addCity
            );

        }


        /* ---------------------------------
           ADD CLASSIFICATION
           --------------------------------- */

        const addClassificationButton =
            getElement(
                "add-classification-button"
            );

        if (addClassificationButton) {

            addClassificationButton.addEventListener(
                "click",
                addClassification
            );

        }


        /* ---------------------------------
           ADD PRIMARY OFFENSE
           --------------------------------- */

        const addOffenseButton =
            getElement(
                "add-offense-button"
            );

        if (addOffenseButton) {

            addOffenseButton.addEventListener(
                "click",
                addOffense
            );

        }


        /* ---------------------------------
           ADD ADDITIONAL OFFENSE
           --------------------------------- */

        const addAdditionalOffenseButton =
            getElement(
                "add-additional-offense-button"
            );

        if (addAdditionalOffenseButton) {

            addAdditionalOffenseButton.addEventListener(
                "click",
                addAdditionalOffense
            );

        }


        /* ---------------------------------
           ADD OUTCOME
           --------------------------------- */

        const addOutcomeButton =
            getElement(
                "add-outcome-button"
            );

        if (addOutcomeButton) {

            addOutcomeButton.addEventListener(
                "click",
                addOutcome
            );

        }


        /* ---------------------------------
           LOGOUT
           --------------------------------- */

        const logoutButton =
            getElement(
                "logout-button"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logoutUser
            );

        }


        /* ---------------------------------
           AUTH STATE
           --------------------------------- */

        supabaseClient.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

                console.log(
                    "Auth event:",
                    event
                );

                if (
                    event ===
                    "SIGNED_IN"
                ) {

                    setHidden(
                        "login-section",
                        true
                    );

                    setHidden(
                        "management-content",
                        false
                    );

                    await loadCaseLookups();

                    await loadCaseList();

                }

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    setHidden(
                        "login-section",
                        false
                    );

                    setHidden(
                        "management-content",
                        true
                    );

                }

            }
        );


        /* ---------------------------------
           INITIAL SESSION
           --------------------------------- */

        await checkLogin();

    }
);


/* -----------------------------------------
   EXPORTS
   ----------------------------------------- */

window.supabaseClient =
    supabaseClient;

window.loadCaseList =
    loadCaseList;

window.loadCase =
    loadCase;

window.saveCase =
    saveCase;

window.checkLogin =
    checkLogin;

window.getCurrentCaseId =
    getCurrentCaseId;

window.loadCaseManagementData =
    loadCaseManagementData;

window.startNewCase =
    startNewCase;

window.cancelNewCase =
    cancelNewCase;