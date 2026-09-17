/* =========================================
   CBRA — MANAGE PEOPLE
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const peopleSupabase =
    window.supabaseClient;


/* -----------------------------------------
   DOM ELEMENTS
   ----------------------------------------- */

let casePeopleList = null;


/* -----------------------------------------
   OFFENSE DATA
   ----------------------------------------- */

let casePersonOffenses = [];


/* =========================================
   HELPERS
   ========================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return dateValue;
    }

    return date.toLocaleDateString();
}


function formatOffenseName(offenseName) {

    if (!offenseName) {
        return "";
    }

    return String(offenseName)
        .replace(/\s+/g, " ")
        .trim();
}


function getOffenseName(offenseId) {

    const offense =
        casePersonOffenses.find(
            function(item) {

                return String(item.id) ===
                    String(offenseId);

            }
        );


    if (!offense) {

        return "Unknown Offense";

    }


    return formatOffenseName(
        offense.name
    );
}


/* =========================================
   CURRENT CASE
   ========================================= */

function getCurrentCaseId() {

    const selectors = [

        "case-selector",
        "case-select",
        "manage-case-selector"

    ];


    for (
        const id of selectors
    ) {

        const element =
            document.getElementById(id);


        if (
            element &&
            element.value
        ) {

            const value =
                element.value;


            if (
                /^\d+$/.test(value)
            ) {

                return Number(value);

            }


            return value;

        }

    }


    const possibleSelectors =
        document.querySelectorAll(
            'select[id*="case"], select[name*="case"]'
        );


    for (
        const element of possibleSelectors
    ) {

        if (element.value) {

            const value =
                element.value;


            if (
                /^\d+$/.test(value)
            ) {

                return Number(value);

            }


            return value;

        }

    }


    return null;
}


/* =========================================
   MESSAGE
   ========================================= */

function showPeopleMessage(
    message,
    type = ""
) {

    let messageElement =
        document.getElementById(
            "people-management-message"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.className =
        "manage-message " + type;
}


/* =========================================
   LOAD / SYNCHRONIZE OFFENSES
   ========================================= */

/*
   IMPORTANT

   The main Case Editor uses a COMPLETE offense
   list.

   That list comes from:

   1. case_offenses
   2. cases.offense
   3. cases.additional_offenses

   Previously Manage People only loaded
   case_offenses.

   That caused the Person Primary Offense and
   Additional Charges dropdowns to contain fewer
   options than the main Case Editor.

   This function now:

   1. Loads case_offenses.
   2. Loads every primary offense used by cases.
   3. Loads every additional offense stored in cases.
   4. Finds any offense names missing from
      case_offenses.
   5. Adds those missing names to case_offenses.
   6. Reloads case_offenses.
   7. Uses that synchronized list everywhere
      in Manage People.

   This is important because
   case_person_offenses.offense_id references
   case_offenses.id.

   Therefore every selectable person charge needs
   an actual case_offenses record.
*/

async function loadCasePersonOffenses() {

    const offenseMap =
        new Map();


    /* -----------------------------------------
       STEP 1
       LOAD EXISTING CASE OFFENSES
       ----------------------------------------- */

    const {
        data: existingOffenses,
        error: offenseError
    } =
        await peopleSupabase
            .from("case_offenses")
            .select(`
                id,
                name
            `)
            .order(
                "name",
                {
                    ascending: true
                }
            );


    if (offenseError) {

        console.error(
            "Error loading case offenses:",
            offenseError
        );

        casePersonOffenses = [];

        return [];

    }


    (existingOffenses || [])
        .forEach(
            function(offense) {

                const name =
                    String(
                        offense.name || ""
                    ).trim();


                if (!name) {
                    return;
                }


                offenseMap.set(
                    name.toLowerCase(),
                    {
                        id:
                            offense.id,

                        name:
                            name
                    }
                );

            }
        );


    /* -----------------------------------------
       STEP 2
       LOAD ALL CASE OFFENSE VALUES
       ----------------------------------------- */

    const {
        data: cases,
        error: casesError
    } =
        await peopleSupabase
            .from("cases")
            .select(`
                offense,
                additional_offenses
            `);


    if (casesError) {

        console.error(
            "Error loading case offense values:",
            casesError
        );

    } else {

        (cases || [])
            .forEach(
                function(caseItem) {

                    /* -------------------------
                       PRIMARY OFFENSE
                       ------------------------- */

                    const primary =
                        String(
                            caseItem.offense || ""
                        ).trim();


                    if (primary) {

                        const key =
                            primary.toLowerCase();


                        if (
                            !offenseMap.has(key)
                        ) {

                            offenseMap.set(
                                key,
                                {
                                    id: null,
                                    name: primary
                                }
                            );

                        }

                    }


                    /* -------------------------
                       ADDITIONAL OFFENSES
                       ------------------------- */

                    const additional =
                        String(
                            caseItem.additional_offenses ||
                            ""
                        )
                            .split(
                                /\s*(?:,|;|\n)\s*/
                            )
                            .map(
                                function(item) {

                                    return String(
                                        item || ""
                                    ).trim();

                                }
                            )
                            .filter(Boolean);


                    additional.forEach(
                        function(offenseName) {

                            const key =
                                offenseName.toLowerCase();


                            if (
                                !offenseMap.has(key)
                            ) {

                                offenseMap.set(
                                    key,
                                    {
                                        id: null,
                                        name:
                                            offenseName
                                    }
                                );

                            }

                        }
                    );

                }
            );

    }


    /* -----------------------------------------
       STEP 3
       FIND MISSING OFFENSES
       ----------------------------------------- */

    const missingOffenses =
        Array.from(
            offenseMap.values()
        )
            .filter(
                function(offense) {

                    return (
                        offense.id === null ||
                        offense.id === undefined
                    );

                }
            );


    console.log(
        "CBRA offenses missing from case_offenses:",
        missingOffenses
    );


    /* -----------------------------------------
       STEP 4
       ADD MISSING OFFENSES TO LOOKUP TABLE
       ----------------------------------------- */

    if (
        missingOffenses.length > 0
    ) {

        for (
            const offense of missingOffenses
        ) {

            const {
                data: inserted,
                error: insertError
            } =
                await peopleSupabase
                    .from("case_offenses")
                    .insert({
                        name:
                            offense.name
                    })
                    .select(`
                        id,
                        name
                    `)
                    .single();


            if (insertError) {

                /*
                   Another record may already exist
                   with the same name.

                   If so, try loading the existing
                   record instead of stopping.
                */

                console.error(
                    "Error synchronizing offense:",
                    offense.name,
                    insertError
                );


                const {
                    data: existingMatch,
                    error: lookupError
                } =
                    await peopleSupabase
                        .from("case_offenses")
                        .select(`
                            id,
                            name
                        `)
                        .ilike(
                            "name",
                            offense.name
                        )
                        .maybeSingle();


                if (
                    !lookupError &&
                    existingMatch
                ) {

                    offenseMap.set(
                        offense.name.toLowerCase(),
                        {
                            id:
                                existingMatch.id,

                            name:
                                existingMatch.name
                        }
                    );

                }


                continue;

            }


            if (
                inserted &&
                inserted.id
            ) {

                offenseMap.set(
                    offense.name.toLowerCase(),
                    {
                        id:
                            inserted.id,

                        name:
                            inserted.name
                    }
                );

            }

        }

    }


    /* -----------------------------------------
       STEP 5
       RELOAD THE REAL CASE OFFENSE TABLE
       ----------------------------------------- */

    const {
        data: finalOffenses,
        error: finalError
    } =
        await peopleSupabase
            .from("case_offenses")
            .select(`
                id,
                name
            `)
            .order(
                "name",
                {
                    ascending: true
                }
            );


    if (finalError) {

        console.error(
            "Error reloading synchronized offenses:",
            finalError
        );

        /*
           Fall back to whatever we successfully
           built above.
        */

        casePersonOffenses =
            Array.from(
                offenseMap.values()
            )
                .filter(
                    function(offense) {

                        return (
                            offense.id !== null &&
                            offense.id !== undefined
                        );

                    }
                )
                .sort(
                    function(a, b) {

                        return String(
                            a.name
                        ).localeCompare(
                            String(
                                b.name
                            ),
                            undefined,
                            {
                                sensitivity:
                                    "base"
                            }
                        );

                    }
                );


        return casePersonOffenses;

    }


    casePersonOffenses =
        finalOffenses || [];


    console.log(
        "CBRA synchronized offense list:",
        casePersonOffenses.length
    );


    return casePersonOffenses;
}


/* =========================================
   LOAD PEOPLE
   ========================================= */

async function loadPeopleSelector() {

    const selector =
        document.getElementById(
            "existing-person-selector"
        );


    if (!selector) {
        return;
    }


    selector.innerHTML =
        '<option value="">Loading people...</option>';


    const {
        data,
        error
    } =
        await peopleSupabase
            .from("people")
            .select(`
                id,
                display_name
            `)
            .order(
                "display_name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading people:",
            error
        );


        selector.innerHTML =
            '<option value="">Unable to load people</option>';


        return;
    }


    selector.innerHTML =
        '<option value="">-- Select Existing Person --</option>';


    (data || []).forEach(
        function(person) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                person.id;


            option.textContent =
                person.display_name;


            selector.appendChild(
                option
            );

        }
    );
}


/* =========================================
   CREATE PEOPLE MANAGEMENT UI
   ========================================= */

function createPeopleManagementForm() {

    casePeopleList =
        document.getElementById(
            "case-people-list"
        );


    if (!casePeopleList) {
        return;
    }


    const existingCard =
        document.getElementById(
            "case-person-management-card"
        );


    if (existingCard) {
        return;
    }


    const card =
        document.createElement("div");


    card.id =
        "case-person-management-card";


    card.className =
        "management-card";


    card.innerHTML = `

        <div class="management-card-header">

            <h4>
                Add Person to Case
            </h4>

            <p>
                Add someone who already exists in CBRA,
                or create a brand-new person.
            </p>

        </div>


        <!-- =================================
             EXISTING PERSON
             ================================= -->

        <div class="person-management-section">

            <h5>
                Add Existing Person
            </h5>

            <form id="case-person-form">

                <div class="form-grid">

                    <div class="form-group">

                        <label for="existing-person-selector">
                            Person
                        </label>

                        <select id="existing-person-selector">

                            <option value="">
                                -- Select Existing Person --
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="existing-person-role">
                            Role
                        </label>

                        <input
                            type="text"
                            id="existing-person-role"
                            placeholder="Example: Defendant"
                        >

                    </div>


                    <div class="form-group">

                        <label for="existing-person-primary-offense">
                            Primary Offense
                        </label>

                        <select
                            id="existing-person-primary-offense"
                        >

                            <option value="">
                                -- Select Primary Offense --
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="existing-person-additional-offenses">
                            Additional Charges
                        </label>

                        <select
                            id="existing-person-additional-offenses"
                            multiple
                            size="7"
                        ></select>

                        <small>
                            Hold Ctrl while clicking to select
                            multiple charges.
                        </small>

                    </div>

                </div>


                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Add Existing Person
                    </button>

                </div>

            </form>

        </div>


        <hr>


        <!-- =================================
             CREATE NEW PERSON
             ================================= -->

        <div class="person-management-section">

            <h5>
                Create New Person
            </h5>

            <p>
                Create a new person and automatically
                attach them to this case.
            </p>


            <form id="new-person-form">

                <div class="form-grid">


                    <!-- NAME -->

                    <div class="form-group">

                        <label for="new-person-name">
                            Name
                        </label>

                        <input
                            type="text"
                            id="new-person-name"
                            placeholder="Full name"
                            required
                        >

                    </div>


                    <!-- DATE OF BIRTH -->

                    <div class="form-group">

                        <label for="new-person-dob">
                            Date of Birth
                        </label>

                        <input
                            type="date"
                            id="new-person-dob"
                        >

                    </div>


                    <!-- AGE -->

                    <div class="form-group">

                        <label for="new-person-age">
                            Age at Case
                        </label>

                        <input
                            type="number"
                            id="new-person-age"
                            min="0"
                            max="120"
                            placeholder="Age"
                        >

                    </div>


                    <!-- GENDER -->

                    <div class="form-group">

                        <label for="new-person-gender">
                            Gender
                        </label>

                        <input
                            type="text"
                            id="new-person-gender"
                            placeholder="Example: Male"
                        >

                    </div>


                    <!-- ROLE -->

                    <div class="form-group">

                        <label for="new-person-role">
                            Role in Case
                        </label>

                        <input
                            type="text"
                            id="new-person-role"
                            placeholder="Example: Defendant"
                        >

                    </div>


                    <!-- PRIMARY OFFENSE -->

                    <div class="form-group">

                        <label for="new-person-primary-offense">
                            Primary Offense
                        </label>

                        <select
                            id="new-person-primary-offense"
                        >

                            <option value="">
                                -- Select Primary Offense --
                            </option>

                        </select>

                    </div>


                    <!-- ADDITIONAL CHARGES -->

                    <div class="form-group">

                        <label for="new-person-additional-offenses">
                            Additional Charges
                        </label>

                        <select
                            id="new-person-additional-offenses"
                            multiple
                            size="7"
                        ></select>

                        <small>
                            Hold Ctrl while clicking to select
                            multiple charges.
                        </small>

                    </div>

                </div>


                <div class="form-actions">

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Create Person & Add to Case
                    </button>

                </div>

            </form>

        </div>


        <div
            id="people-management-message"
            class="manage-message"
        ></div>

    `;


    casePeopleList.parentNode.insertBefore(
        card,
        casePeopleList
    );


    populateAllPersonOffenseSelectors();


    const existingPersonForm =
        document.getElementById(
            "case-person-form"
        );


    if (existingPersonForm) {

        existingPersonForm.addEventListener(
            "submit",
            addExistingPerson
        );

    }


    const newPersonForm =
        document.getElementById(
            "new-person-form"
        );


    if (newPersonForm) {

        newPersonForm.addEventListener(
            "submit",
            createPerson
        );

    }


    loadPeopleSelector();
}


/* =========================================
   POPULATE OFFENSE SELECTORS
   ========================================= */

function populateAllPersonOffenseSelectors() {

    const selectors = [

        "existing-person-primary-offense",

        "existing-person-additional-offenses",

        "new-person-primary-offense",

        "new-person-additional-offenses"

    ];


    selectors.forEach(
        function(id) {

            const selector =
                document.getElementById(id);


            if (!selector) {
                return;
            }


            selector.innerHTML =
                "";


            if (
                id.includes("primary")
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    "";


                option.textContent =
                    "-- Select Primary Offense --";


                selector.appendChild(
                    option
                );

            }


            casePersonOffenses.forEach(
                function(offense) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        offense.id;


                    option.textContent =
                        formatOffenseName(
                            offense.name
                        );


                    selector.appendChild(
                        option
                    );

                }
            );

        }
    );
}


/* =========================================
   GET SELECTED CHARGES
   ========================================= */

function getChargesFromSelectors(
    primarySelector,
    additionalSelector
) {

    const ids = [];


    if (
        primarySelector &&
        primarySelector.value
    ) {

        ids.push(
            String(
                primarySelector.value
            )
        );

    }


    if (additionalSelector) {

        Array.from(
            additionalSelector.selectedOptions
        ).forEach(
            function(option) {

                const id =
                    String(
                        option.value
                    );


                if (
                    id &&
                    !ids.includes(id)
                ) {

                    ids.push(id);

                }

            }
        );

    }


    return ids;
}


/* =========================================
   ADD EXISTING PERSON
   ========================================= */

async function addExistingPerson(event) {

    event.preventDefault();


    const caseId =
        getCurrentCaseId();


    if (!caseId) {

        showPeopleMessage(
            "Please select a case first.",
            "error"
        );

        return;
    }


    const personSelector =
        document.getElementById(
            "existing-person-selector"
        );


    const roleInput =
        document.getElementById(
            "existing-person-role"
        );


    const primarySelector =
        document.getElementById(
            "existing-person-primary-offense"
        );


    const additionalSelector =
        document.getElementById(
            "existing-person-additional-offenses"
        );


    const personId =
        personSelector?.value;


    const role =
        roleInput?.value.trim() ||
        "Unknown";


    if (!personId) {

        showPeopleMessage(
            "Please select a person.",
            "error"
        );

        return;
    }


    /* -----------------------------------------
       ATTACH PERSON
       ----------------------------------------- */

    const {
        data,
        error
    } =
        await peopleSupabase
            .from("case_people")
            .insert({
                case_id:
                    caseId,

                person_id:
                    personId,

                role:
                    role
            })
            .select()
            .single();


    if (error) {

        console.error(
            "Error adding existing person:",
            error
        );


        if (
            error.code === "23505"
        ) {

            showPeopleMessage(
                "This person is already attached to this case.",
                "error"
            );

        } else {

            showPeopleMessage(
                "Unable to add person: " +
                error.message,
                "error"
            );

        }


        return;
    }


    /* -----------------------------------------
       SAVE CHARGES
       ----------------------------------------- */

    const offenseIds =
        getChargesFromSelectors(
            primarySelector,
            additionalSelector
        );


    if (
        offenseIds.length > 0
    ) {

        const chargeRows =
            offenseIds.map(
                function(offenseId) {

                    return {

                        case_people_id:
                            data.id,

                        offense_id:
                            offenseId

                    };

                }
            );


        const {
            error: chargeError
        } =
            await peopleSupabase
                .from(
                    "case_person_offenses"
                )
                .insert(
                    chargeRows
                );


        if (chargeError) {

            console.error(
                "Error saving charges:",
                chargeError
            );


            showPeopleMessage(
                "Person added, but charges could not be saved: " +
                chargeError.message,
                "error"
            );

        } else {

            showPeopleMessage(
                "Person and charges added successfully.",
                "success"
            );

        }

    } else {

        showPeopleMessage(
            "Person added successfully.",
            "success"
        );

    }


    const form =
        document.getElementById(
            "case-person-form"
        );


    if (form) {
        form.reset();
    }


    await loadPeopleSelector();

    await loadPeople(caseId);
}


/* =========================================
   CREATE NEW PERSON
   ========================================= */

async function createPerson(event) {

    event.preventDefault();


    const caseId =
        getCurrentCaseId();


    if (!caseId) {

        showPeopleMessage(
            "Please select a case first.",
            "error"
        );

        return;
    }


    /* -----------------------------------------
       GET FORM VALUES
       ----------------------------------------- */

    const nameInput =
        document.getElementById(
            "new-person-name"
        );


    const dobInput =
        document.getElementById(
            "new-person-dob"
        );


    const ageInput =
        document.getElementById(
            "new-person-age"
        );


    const genderInput =
        document.getElementById(
            "new-person-gender"
        );


    const roleInput =
        document.getElementById(
            "new-person-role"
        );


    const primarySelector =
        document.getElementById(
            "new-person-primary-offense"
        );


    const additionalSelector =
        document.getElementById(
            "new-person-additional-offenses"
        );


    const displayName =
        nameInput?.value.trim() ||
        "";


    const dateOfBirth =
        dobInput?.value ||
        null;


    const age =
        ageInput?.value
            ? Number(
                ageInput.value
            )
            : null;


    const gender =
        genderInput?.value.trim() ||
        null;


    const role =
        roleInput?.value.trim() ||
        "Unknown";


    if (!displayName) {

        showPeopleMessage(
            "Please enter the person's name.",
            "error"
        );

        return;
    }


    /* -----------------------------------------
       CREATE PERSON
       ----------------------------------------- */

    const {
        data: person,
        error: personError
    } =
        await peopleSupabase
            .from("people")
            .insert({
                display_name:
                    displayName,

                age_at_case:
                    age,

                gender:
                    gender,

                date_of_birth:
                    dateOfBirth
            })
            .select()
            .single();


    if (personError) {

        console.error(
            "Error creating person:",
            personError
        );


        showPeopleMessage(
            "Unable to create person: " +
            personError.message,
            "error"
        );

        return;
    }


    if (
        !person ||
        !person.id
    ) {

        showPeopleMessage(
            "Person was created, but no person ID was returned.",
            "error"
        );

        return;
    }


    /* -----------------------------------------
       ATTACH TO CASE
       ----------------------------------------- */

    const {
        data: casePerson,
        error: casePersonError
    } =
        await peopleSupabase
            .from("case_people")
            .insert({
                case_id:
                    caseId,

                person_id:
                    person.id,

                role:
                    role
            })
            .select()
            .single();


    if (casePersonError) {

        console.error(
            "Error attaching new person:",
            casePersonError
        );


        showPeopleMessage(
            "Person was created, but could not be attached to the case: " +
            casePersonError.message,
            "error"
        );

        return;
    }


    /* -----------------------------------------
       SAVE CHARGES
       ----------------------------------------- */

    const offenseIds =
        getChargesFromSelectors(
            primarySelector,
            additionalSelector
        );


    if (
        offenseIds.length > 0
    ) {

        const chargeRows =
            offenseIds.map(
                function(offenseId) {

                    return {

                        case_people_id:
                            casePerson.id,

                        offense_id:
                            offenseId

                    };

                }
            );


        const {
            error: chargeError
        } =
            await peopleSupabase
                .from(
                    "case_person_offenses"
                )
                .insert(
                    chargeRows
                );


        if (chargeError) {

            console.error(
                "Error saving new person charges:",
                chargeError
            );


            showPeopleMessage(
                "Person was added to the case, but charges could not be saved: " +
                chargeError.message,
                "error"
            );

        } else {

            showPeopleMessage(
                "Person created, added to the case, and charges saved.",
                "success"
            );

        }

    } else {

        showPeopleMessage(
            "Person created and added to the case.",
            "success"
        );

    }


    /* -----------------------------------------
       RESET
       ----------------------------------------- */

    const form =
        document.getElementById(
            "new-person-form"
        );


    if (form) {
        form.reset();
    }


    await loadPeopleSelector();

    await loadPeople(caseId);
}


/* =========================================
   LOAD PEOPLE ATTACHED TO CASE
   ========================================= */

async function loadPeople(caseId) {

    if (!caseId) {

        if (casePeopleList) {

            casePeopleList.innerHTML =
                '<p class="empty-message">Select a case to view this information.</p>';

        }

        return;
    }


    if (!casePeopleList) {

        casePeopleList =
            document.getElementById(
                "case-people-list"
            );

    }


    if (!casePeopleList) {
        return;
    }


    casePeopleList.innerHTML =
        "<p>Loading people...</p>";


    await loadCasePersonOffenses();


    /* -----------------------------------------
       GET CASE PRIMARY OFFENSE
       ----------------------------------------- */

    let casePrimaryOffenseId =
        null;


    const {
        data: caseData
    } =
        await peopleSupabase
            .from("cases")
            .select(`
                id,
                offense
            `)
            .eq(
                "id",
                caseId
            )
            .maybeSingle();


    if (
        caseData &&
        caseData.offense
    ) {

        const matchingOffense =
            casePersonOffenses.find(
                function(offense) {

                    return String(
                        offense.name
                    ).trim().toLowerCase() ===
                    String(
                        caseData.offense
                    ).trim().toLowerCase();

                }
            );


        if (matchingOffense) {

            casePrimaryOffenseId =
                matchingOffense.id;

        }

    }


    /* -----------------------------------------
       LOAD CASE PEOPLE
       ----------------------------------------- */

    const {
        data,
        error
    } =
        await peopleSupabase
            .from("case_people")
            .select(`
                id,
                case_id,
                person_id,
                role,
                people (
                    id,
                    display_name,
                    age_at_case,
                    date_of_birth,
                    gender
                )
            `)
            .eq(
                "case_id",
                caseId
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading case people:",
            error
        );


        casePeopleList.innerHTML =
            "<p>Unable to load people.</p>";

        return;
    }


    /* -----------------------------------------
       RECREATE MANAGEMENT FORM
       ----------------------------------------- */

    casePeopleList.innerHTML =
        "";


    createPeopleManagementForm();


    if (
        !data ||
        data.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "p"
            );


        emptyMessage.className =
            "empty-message";


        emptyMessage.textContent =
            "No people are connected to this case yet.";


        casePeopleList.appendChild(
            emptyMessage
        );


        return;
    }


    /* -----------------------------------------
       HEADING
       ----------------------------------------- */

    const heading =
        document.createElement(
            "h4"
        );


    heading.textContent =
        "People Attached to Case";


    heading.style.marginTop =
        "2rem";


    casePeopleList.appendChild(
        heading
    );


    /* -----------------------------------------
       RENDER PEOPLE
       ----------------------------------------- */

    for (
        const entry of data
    ) {

        await renderCasePerson(
            entry,
            casePrimaryOffenseId
        );

    }

}


/* =========================================
   RENDER PERSON
   ========================================= */

async function renderCasePerson(
    entry,
    casePrimaryOffenseId
) {

    const person =
        entry.people;


    if (!person) {
        return;
    }


    const peopleDisplay =
        document.getElementById(
            "case-people-list"
        );


    if (!peopleDisplay) {
        return;
    }


    /* -----------------------------------------
       LOAD CHARGES
       ----------------------------------------- */

    const {
        data: charges
    } =
        await peopleSupabase
            .from(
                "case_person_offenses"
            )
            .select(`
                id,
                case_people_id,
                offense_id
            `)
            .eq(
                "case_people_id",
                entry.id
            );


    const personCharges =
        charges || [];


    const chargeIds =
        personCharges.map(
            function(charge) {

                return String(
                    charge.offense_id
                );

            }
        );


    /* -----------------------------------------
       PERSON CARD
       ----------------------------------------- */

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "case-person-item";


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "case-person-info";


    /* NAME */

    const name =
        document.createElement(
            "h3"
        );


    name.textContent =
        person.display_name ||
        "Unnamed Person";


    info.appendChild(
        name
    );


    /* ROLE */

    const role =
        document.createElement(
            "p"
        );


    role.innerHTML =
        "<strong>Role:</strong> " +
        escapeHTML(
            entry.role ||
            "Unknown"
        );


    info.appendChild(
        role
    );


    /* AGE */

    if (
        person.age_at_case !== null &&
        person.age_at_case !== undefined
    ) {

        const age =
            document.createElement(
                "p"
            );


        age.innerHTML =
            "<strong>Age at Case:</strong> " +
            escapeHTML(
                person.age_at_case
            );


        info.appendChild(
            age
        );

    }


    /* DOB */

    if (person.date_of_birth) {

        const dob =
            document.createElement(
                "p"
            );


        dob.innerHTML =
            "<strong>Date of Birth:</strong> " +
            escapeHTML(
                formatDate(
                    person.date_of_birth
                )
            );


        info.appendChild(
            dob
        );

    }


    /* GENDER */

    if (person.gender) {

        const gender =
            document.createElement(
                "p"
            );


        gender.innerHTML =
            "<strong>Gender:</strong> " +
            escapeHTML(
                person.gender
            );


        info.appendChild(
            gender
        );

    }


    /* -----------------------------------------
       CHARGES
       ----------------------------------------- */

    const chargesContainer =
        document.createElement(
            "div"
        );


    chargesContainer.className =
        "case-person-charges";


    const chargesHeading =
        document.createElement(
            "p"
        );


    chargesHeading.innerHTML =
        "<strong>Charges:</strong>";


    chargesContainer.appendChild(
        chargesHeading
    );


    if (
        personCharges.length === 0
    ) {

        const none =
            document.createElement(
                "p"
            );


        none.className =
            "empty-message";


        none.textContent =
            "No charges assigned to this person.";


        chargesContainer.appendChild(
            none
        );

    } else {

        const chargeList =
            document.createElement(
                "ul"
            );


        chargeList.className =
            "case-person-charge-list";


        personCharges.forEach(
            function(charge) {

                const item =
                    document.createElement(
                        "li"
                    );


                const chargeName =
                    document.createElement(
                        "span"
                    );


                chargeName.textContent =
                    getOffenseName(
                        charge.offense_id
                    );


                item.appendChild(
                    chargeName
                );


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.textContent =
                    "Remove";


                removeButton.className =
                    "danger";


                removeButton.style.marginLeft =
                    "0.5rem";


                removeButton.addEventListener(
                    "click",
                    function() {

                        removePersonCharge(
                            charge.id
                        );

                    }
                );


                item.appendChild(
                    removeButton
                );


                chargeList.appendChild(
                    item
                );

            }
        );


        chargesContainer.appendChild(
            chargeList
        );

    }


    info.appendChild(
        chargesContainer
    );


    wrapper.appendChild(
        info
    );


    /* -----------------------------------------
       BUTTONS
       ----------------------------------------- */

    const buttons =
        document.createElement(
            "div"
        );


    buttons.className =
        "case-person-buttons";


    /* VIEW PERSON */

    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.textContent =
        "View Person";


    viewButton.addEventListener(
        "click",
        function() {

            viewPerson(
                person.id
            );

        }
    );


    /* EDIT CHARGES */

    const editButton =
        document.createElement(
            "button"
        );


    editButton.type =
        "button";


    editButton.textContent =
        "Edit Charges";


    editButton.addEventListener(
        "click",
        function() {

            openPersonChargeEditor(
                entry,
                chargeIds,
                casePrimaryOffenseId
            );

        }
    );


    /* REMOVE PERSON */

    const removeButton =
        document.createElement(
            "button"
        );


    removeButton.type =
        "button";


    removeButton.textContent =
        "Remove From Case";


    removeButton.className =
        "danger";


    removeButton.addEventListener(
        "click",
        function() {

            removePersonFromCase(
                entry.id
            );

        }
    );


    buttons.appendChild(
        viewButton
    );


    buttons.appendChild(
        editButton
    );


    buttons.appendChild(
        removeButton
    );


    wrapper.appendChild(
        buttons
    );


    peopleDisplay.appendChild(
        wrapper
    );

}


/* =========================================
   EDIT CHARGES
   ========================================= */

async function openPersonChargeEditor(
    entry,
    existingChargeIds,
    casePrimaryOffenseId
) {

    const existing =
        document.getElementById(
            "person-charge-editor"
        );


    if (existing) {
        existing.remove();
    }


    const editor =
        document.createElement(
            "div"
        );


    editor.id =
        "person-charge-editor";


    editor.className =
        "management-card";


    editor.innerHTML = `

        <div class="management-card-header">

            <h4>
                Edit Charges
            </h4>

            <p>
                ${escapeHTML(
                    entry.people?.display_name ||
                    "Person"
                )}
            </p>

        </div>


        <form id="person-charge-editor-form">

            <div class="form-grid">

                <div class="form-group">

                    <label for="edit-person-primary-offense">
                        Primary Offense
                    </label>

                    <select
                        id="edit-person-primary-offense"
                    >

                        <option value="">
                            -- Select Primary Offense --
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label for="edit-person-additional-offenses">
                        Additional Charges
                    </label>

                    <select
                        id="edit-person-additional-offenses"
                        multiple
                        size="7"
                    ></select>

                </div>

            </div>


            <div class="form-actions">

                <button
                    type="submit"
                    class="primary-button"
                >
                    Save Charges
                </button>


                <button
                    type="button"
                    id="cancel-person-charge-edit"
                    class="secondary-button"
                >
                    Cancel
                </button>

            </div>


            <div
                id="person-charge-edit-message"
                class="manage-message"
            ></div>

        </form>

    `;


    const peopleDisplay =
        document.getElementById(
            "case-people-list"
        );


    if (!peopleDisplay) {
        return;
    }


    peopleDisplay.insertBefore(
        editor,
        peopleDisplay.children[1] || null
    );


    const primarySelector =
        document.getElementById(
            "edit-person-primary-offense"
        );


    const additionalSelector =
        document.getElementById(
            "edit-person-additional-offenses"
        );


    /*
       Make sure the offense list is current
       before building the editor.
    */

    await loadCasePersonOffenses();


    casePersonOffenses.forEach(
        function(offense) {

            const primaryOption =
                document.createElement(
                    "option"
                );


            primaryOption.value =
                offense.id;


            primaryOption.textContent =
                formatOffenseName(
                    offense.name
                );


            primarySelector.appendChild(
                primaryOption
            );


            const additionalOption =
                document.createElement(
                    "option"
                );


            additionalOption.value =
                offense.id;


            additionalOption.textContent =
                formatOffenseName(
                    offense.name
                );


            additionalSelector.appendChild(
                additionalOption
            );

        }
    );


    const ids =
        existingChargeIds.map(
            function(id) {

                return String(id);

            }
        );


    if (
        casePrimaryOffenseId !== null &&
        casePrimaryOffenseId !== undefined &&
        ids.includes(
            String(
                casePrimaryOffenseId
            )
        )
    ) {

        primarySelector.value =
            String(
                casePrimaryOffenseId
            );


        ids.splice(
            ids.indexOf(
                String(
                    casePrimaryOffenseId
                )
            ),
            1
        );

    } else if (
        ids.length > 0
    ) {

        primarySelector.value =
            ids[0];

        ids.shift();

    }


    ids.forEach(
        function(id) {

            const option =
                Array.from(
                    additionalSelector.options
                ).find(
                    function(item) {

                        return String(
                            item.value
                        ) ===
                        String(id);

                    }
                );


            if (option) {

                option.selected =
                    true;

            }

        }
    );


    const cancelButton =
        document.getElementById(
            "cancel-person-charge-edit"
        );


    cancelButton.addEventListener(
        "click",
        function() {

            editor.remove();

        }
    );


    const form =
        document.getElementById(
            "person-charge-editor-form"
        );


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            await savePersonCharges(
                entry.id,
                primarySelector,
                additionalSelector
            );

        }
    );

}


/* =========================================
   SAVE CHARGES
   ========================================= */

async function savePersonCharges(
    casePeopleId,
    primarySelector,
    additionalSelector
) {

    const message =
        document.getElementById(
            "person-charge-edit-message"
        );


    const offenseIds =
        getChargesFromSelectors(
            primarySelector,
            additionalSelector
        );


    const {
        error: deleteError
    } =
        await peopleSupabase
            .from(
                "case_person_offenses"
            )
            .delete()
            .eq(
                "case_people_id",
                casePeopleId
            );


    if (deleteError) {

        console.error(
            "Error deleting existing charges:",
            deleteError
        );


        if (message) {

            message.textContent =
                "Unable to update charges: " +
                deleteError.message;


            message.className =
                "manage-message error";

        }


        return;
    }


    if (
        offenseIds.length > 0
    ) {

        const rows =
            offenseIds.map(
                function(offenseId) {

                    return {

                        case_people_id:
                            casePeopleId,

                        offense_id:
                            offenseId

                    };

                }
            );


        const {
            error: insertError
        } =
            await peopleSupabase
                .from(
                    "case_person_offenses"
                )
                .insert(
                    rows
                );


        if (insertError) {

            console.error(
                "Error inserting charges:",
                insertError
            );


            if (message) {

                message.textContent =
                    "Unable to save charges: " +
                    insertError.message;


                message.className =
                    "manage-message error";

            }


            return;
        }

    }


    if (message) {

        message.textContent =
            "Charges updated successfully.";


        message.className =
            "manage-message success";

    }


    const caseId =
        getCurrentCaseId();


    const editor =
        document.getElementById(
            "person-charge-editor"
        );


    if (editor) {
        editor.remove();
    }


    if (caseId) {
        await loadPeople(caseId);
    }

}


/* =========================================
   REMOVE PERSON CHARGE
   ========================================= */

async function removePersonCharge(
    chargeRecordId
) {

    if (!chargeRecordId) {
        return;
    }


    const confirmed =
        confirm(
            "Remove this charge from this person?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await peopleSupabase
            .from(
                "case_person_offenses"
            )
            .delete()
            .eq(
                "id",
                chargeRecordId
            );


    if (error) {

        console.error(
            "Error removing person charge:",
            error
        );


        alert(
            "Unable to remove charge:\n\n" +
            error.message
        );


        return;
    }


    const caseId =
        getCurrentCaseId();


    if (caseId) {
        await loadPeople(caseId);
    }

}


/* =========================================
   REMOVE PERSON FROM CASE
   ========================================= */

async function removePersonFromCase(
    casePeopleId
) {

    if (!casePeopleId) {
        return;
    }


    const confirmed =
        confirm(
            "Remove this person from the case?"
        );


    if (!confirmed) {
        return;
    }


    /* -----------------------------------------
       DELETE CHARGES FIRST
       ----------------------------------------- */

    const {
        error: chargeError
    } =
        await peopleSupabase
            .from(
                "case_person_offenses"
            )
            .delete()
            .eq(
                "case_people_id",
                casePeopleId
            );


    if (chargeError) {

        console.error(
            "Error removing charges:",
            chargeError
        );


        alert(
            "Unable to remove the person's charges:\n\n" +
            chargeError.message
        );


        return;
    }


    /* -----------------------------------------
       DELETE CASE PERSON
       ----------------------------------------- */

    const {
        error
    } =
        await peopleSupabase
            .from(
                "case_people"
            )
            .delete()
            .eq(
                "id",
                casePeopleId
            );


    if (error) {

        console.error(
            "Error removing person:",
            error
        );


        alert(
            "Unable to remove person:\n\n" +
            error.message
        );


        return;
    }


    const caseId =
        getCurrentCaseId();


    if (caseId) {

        await loadPeopleSelector();

        await loadPeople(
            caseId
        );

    }

}


/* =========================================
   VIEW PERSON
   ========================================= */

function viewPerson(personId) {

    if (!personId) {
        return;
    }


    window.location.href =
        "person.html?id=" +
        encodeURIComponent(
            personId
        );

}


/* =========================================
   REFRESH
   ========================================= */

async function refreshPeopleForCase(
    caseId
) {

    if (!caseId) {

        caseId =
            getCurrentCaseId();

    }


    if (!caseId) {
        return;
    }


    await loadCasePersonOffenses();

    await loadPeopleSelector();

    await loadPeople(
        caseId
    );

}


/* =========================================
   INITIALIZE
   ========================================= */

async function initializeManagePeople() {

    casePeopleList =
        document.getElementById(
            "case-people-list"
        );


    await loadCasePersonOffenses();

}


/* =========================================
   DOM READY
   ========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeManagePeople();

    }
);


/* =========================================
   GLOBAL EXPORTS
   ========================================= */

window.getCurrentCaseId =
    getCurrentCaseId;

window.loadPeopleSelector =
    loadPeopleSelector;

window.loadPeople =
    loadPeople;

window.addPerson =
    addExistingPerson;

window.createPerson =
    createPerson;

window.removePersonFromCase =
    removePersonFromCase;

window.removePersonCharge =
    removePersonCharge;

window.viewPerson =
    viewPerson;

window.refreshPeopleForCase =
    refreshPeopleForCase;

window.loadCasePersonOffenses =
    loadCasePersonOffenses;

window.openPersonChargeEditor =
    openPersonChargeEditor;

window.savePersonCharges =
    savePersonCharges;