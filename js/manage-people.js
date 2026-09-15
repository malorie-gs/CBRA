/* =========================================
   CBRA — MANAGE PEOPLE
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const peopleSupabase = window.supabaseClient;


/* -----------------------------------------
   DOM ELEMENTS
   ----------------------------------------- */

const casePersonForm =
    document.getElementById("case-person-form");

const personSelector =
    document.getElementById("person-selector");

const personRole =
    document.getElementById("person-role");

const casePeopleList =
    document.getElementById("case-people-list");

const casePersonMessage =
    document.getElementById("case-person-message");

const newPersonForm =
    document.getElementById("new-person-form");

const newPersonMessage =
    document.getElementById("new-person-message");


/* -----------------------------------------
   CURRENT CASE ID
   ----------------------------------------- */

function getCurrentCaseId() {

    const selectors = [
        "case-selector",
        "case-select",
        "manage-case-selector"
    ];

    for (const id of selectors) {

        const element =
            document.getElementById(id);

        if (element && element.value) {

            const value =
                element.value;

            if (/^\d+$/.test(value)) {
                return Number(value);
            }

            return value;
        }
    }


    const possibleCaseSelectors =
        document.querySelectorAll(
            'select[id*="case"], select[name*="case"]'
        );


    for (const element of possibleCaseSelectors) {

        if (element.value) {

            const value =
                element.value;

            if (/^\d+$/.test(value)) {
                return Number(value);
            }

            return value;
        }
    }


    return null;
}


/* =========================================
   MESSAGE HELPERS
   ========================================= */

function showCasePersonMessage(
    message,
    type = ""
) {

    if (casePersonMessage) {

        casePersonMessage.textContent =
            message;

        casePersonMessage.className =
            "case-person-message " + type;
    }

    if (newPersonMessage) {

        newPersonMessage.textContent =
            message;

        newPersonMessage.className =
            "new-person-message " + type;
    }
}


/* =========================================
   ESCAPE HTML
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


/* =========================================
   FORMAT DATE
   ========================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString();
}


/* =========================================
   OFFENSE DATA
   ========================================= */

let casePersonOffenses = [];


/* -----------------------------------------
   LOAD ALL OFFENSES
   ----------------------------------------- */

async function loadCasePersonOffenses() {

    const {
        data,
        error
    } = await peopleSupabase
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


    if (error) {

        console.error(
            "Error loading case offenses:",
            error
        );

        casePersonOffenses = [];

        return [];
    }


    casePersonOffenses =
        data || [];


    return casePersonOffenses;
}


/* -----------------------------------------
   FORMAT OFFENSE NAME
   ----------------------------------------- */

function formatOffenseName(
    offenseName
) {

    if (!offenseName) {
        return "";
    }

    return String(offenseName)
        .replace(/\s+/g, " ")
        .trim();
}


/* -----------------------------------------
   FIND OFFENSE NAME
   ----------------------------------------- */

function getOffenseName(
    offenseId
) {

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
   LOAD PEOPLE SELECTOR
   ========================================= */

async function loadPeopleSelector(caseId) {

    if (!personSelector) {
        return;
    }


    personSelector.innerHTML =
        '<option value="">Loading people...</option>';


    const {
        data,
        error
    } = await peopleSupabase
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
            "Error loading people selector:",
            error
        );

        personSelector.innerHTML =
            '<option value="">Unable to load people</option>';

        return;
    }


    personSelector.innerHTML =
        '<option value="">-- Select Person --</option>';


    (data || []).forEach(
        function(person) {

            const option =
                document.createElement("option");

            option.value =
                person.id;

            option.textContent =
                person.display_name;

            personSelector.appendChild(
                option
            );
        }
    );
}


/* =========================================
   CREATE PEOPLE MANAGEMENT FORM
   ========================================= */

function createPeopleManagementForm() {

    const existingForm =
        document.getElementById(
            "case-person-management-card"
        );


    if (existingForm) {
        return;
    }


    const container =
        document.getElementById(
            "case-people-list"
        );


    if (!container) {
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
                Connect a person to this case and assign
                the charges associated with that person.
            </p>

        </div>


        <form id="case-person-form">

            <div class="form-grid">


                <!-- PERSON -->

                <div class="form-group">

                    <label for="person-selector">
                        Person
                    </label>

                    <select id="person-selector">

                        <option value="">
                            -- Select Person --
                        </option>

                    </select>

                </div>


                <!-- ROLE -->

                <div class="form-group">

                    <label for="person-role">
                        Role
                    </label>

                    <input
                        type="text"
                        id="person-role"
                        placeholder="Example: Defendant"
                    >

                </div>


                <!-- PRIMARY OFFENSE -->

                <div class="form-group">

                    <label for="person-primary-offense">

                        Primary Offense

                    </label>

                    <select
                        id="person-primary-offense"
                    >

                        <option value="">
                            -- Select Primary Offense --
                        </option>

                    </select>

                    <small>
                        Select the primary offense associated
                        with this person.
                    </small>

                </div>


                <!-- ADDITIONAL CHARGES -->

                <div class="form-group">

                    <label for="person-additional-offenses">

                        Additional Charges

                    </label>

                    <select
                        id="person-additional-offenses"
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
                    Add Person
                </button>

            </div>


            <div
                id="case-person-message"
                class="manage-message"
            ></div>

        </form>

    `;


    container.parentNode.insertBefore(
        card,
        container
    );


    const newForm =
        document.getElementById(
            "case-person-form"
        );


    if (newForm) {

        newForm.addEventListener(
            "submit",
            addPerson
        );
    }


    populatePersonOffenseSelectors();
}


/* =========================================
   POPULATE PERSON OFFENSE SELECTORS
   ========================================= */

function populatePersonOffenseSelectors() {

    const primarySelector =
        document.getElementById(
            "person-primary-offense"
        );

    const additionalSelector =
        document.getElementById(
            "person-additional-offenses"
        );


    if (!primarySelector ||
        !additionalSelector) {

        return;
    }


    primarySelector.innerHTML =
        '<option value="">-- Select Primary Offense --</option>';


    additionalSelector.innerHTML = "";


    casePersonOffenses.forEach(
        function(offense) {

            const name =
                formatOffenseName(
                    offense.name
                );


            /* PRIMARY */

            const primaryOption =
                document.createElement(
                    "option"
                );

            primaryOption.value =
                offense.id;

            primaryOption.textContent =
                name;

            primarySelector.appendChild(
                primaryOption
            );


            /* ADDITIONAL */

            const additionalOption =
                document.createElement(
                    "option"
                );

            additionalOption.value =
                offense.id;

            additionalOption.textContent =
                name;

            additionalSelector.appendChild(
                additionalOption
            );
        }
    );
}


/* =========================================
   GET SELECTED OFFENSE IDS
   ========================================= */

function getSelectedPersonOffenseIds() {

    const primarySelector =
        document.getElementById(
            "person-primary-offense"
        );

    const additionalSelector =
        document.getElementById(
            "person-additional-offenses"
        );


    const offenseIds =
        [];


    /* -----------------------------------------
       PRIMARY
       ----------------------------------------- */

    if (
        primarySelector &&
        primarySelector.value
    ) {

        offenseIds.push(
            String(
                primarySelector.value
            )
        );
    }


    /* -----------------------------------------
       ADDITIONAL
       ----------------------------------------- */

    if (additionalSelector) {

        Array.from(
            additionalSelector.selectedOptions
        ).forEach(
            function(option) {

                const offenseId =
                    String(option.value);


                if (
                    offenseId &&
                    !offenseIds.includes(
                        offenseId
                    )
                ) {

                    offenseIds.push(
                        offenseId
                    );
                }
            }
        );
    }


    return offenseIds;
}


/* =========================================
   SET OFFENSE SELECTED VALUES
   ========================================= */

function setPersonOffenseSelectors(
    offenseIds,
    casePrimaryOffenseId
) {

    const primarySelector =
        document.getElementById(
            "person-primary-offense"
        );

    const additionalSelector =
        document.getElementById(
            "person-additional-offenses"
        );


    if (!primarySelector ||
        !additionalSelector) {

        return;
    }


    primarySelector.value = "";


    Array.from(
        additionalSelector.options
    ).forEach(
        function(option) {

            option.selected = false;
        }
    );


    const ids =
        (offenseIds || [])
            .map(
                function(id) {
                    return String(id);
                }
            );


    /*
     * If the case's primary offense is assigned
     * to this person, show it as the primary.
     */

    if (
        casePrimaryOffenseId !== null &&
        casePrimaryOffenseId !== undefined &&
        ids.includes(
            String(casePrimaryOffenseId)
        )
    ) {

        primarySelector.value =
            String(casePrimaryOffenseId);

        ids.splice(
            ids.indexOf(
                String(casePrimaryOffenseId)
            ),
            1
        );
    }


    /*
     * Remaining charges are additional charges.
     */

    ids.forEach(
        function(id) {

            const option =
                Array.from(
                    additionalSelector.options
                ).find(
                    function(item) {

                        return String(item.value) ===
                            String(id);
                    }
                );


            if (option) {
                option.selected = true;
            }
        }
    );
}


/* =========================================
   LOAD PEOPLE ATTACHED TO CASE
   ========================================= */

async function loadPeople(caseId) {

    if (!casePeopleList) {
        return;
    }


    if (!caseId) {

        casePeopleList.innerHTML =
            "<p>Please select a case.</p>";

        return;
    }


    casePeopleList.innerHTML =
        "<p>Loading people...</p>";


    console.log(
        "Loading people for case:",
        caseId
    );


    /*
     * Make sure offense list is available.
     */

    await loadCasePersonOffenses();


    /*
     * Get the case's primary offense.
     */

    let caseData = null;


    const {
        data: currentCase,
        error: caseError
    } = await peopleSupabase
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


    if (!caseError) {

        caseData =
            currentCase;
    }


    /*
     * Load people.
     */

    const {
        data,
        error
    } = await peopleSupabase
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


    console.log(
        "People attached to case:",
        data
    );


    /*
     * Recreate the add-person form.
     */

    casePeopleList.innerHTML = "";


    createPeopleManagementForm();


    /*
     * Get the list container again because
     * createPeopleManagementForm may have
     * changed the DOM.
     */

    const peopleDisplay =
        document.getElementById(
            "case-people-list"
        );


    if (
        !data ||
        data.length === 0
    ) {

        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "empty-message";

        emptyMessage.textContent =
            "No people are connected to this case yet.";

        peopleDisplay.appendChild(
            emptyMessage
        );

        return;
    }


    /*
     * Create heading for attached people.
     */

    const heading =
        document.createElement("h4");

    heading.textContent =
        "People Attached to Case";

    heading.style.marginTop =
        "2rem";

    peopleDisplay.appendChild(
        heading
    );


    /*
     * Load every person's charges.
     */

    for (
        const entry of data
    ) {

        await renderCasePerson(
            entry,
            caseData
        );
    }
}


/* =========================================
   RENDER ONE CASE PERSON
   ========================================= */

async function renderCasePerson(
    entry,
    caseData
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
       GET PERSON'S CHARGES
       ----------------------------------------- */

    const {
        data: chargeRows,
        error: chargeError
    } = await peopleSupabase
        .from("case_person_offenses")
        .select(`
            id,
            case_people_id,
            offense_id
        `)
        .eq(
            "case_people_id",
            entry.id
        );


    if (chargeError) {

        console.error(
            "Error loading person charges:",
            chargeError
        );
    }


    const charges =
        chargeRows || [];


    const chargeIds =
        charges.map(
            function(charge) {

                return String(
                    charge.offense_id
                );
            }
        );


    /*
     * Find the case primary offense ID.
     *
     * The cases table stores the offense as text,
     * while case_offenses stores offense IDs.
     */

    let casePrimaryOffenseId = null;


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
       PERSON CARD
       ----------------------------------------- */

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "case-person-item";


    /* -----------------------------------------
       PERSON INFO
       ----------------------------------------- */

    const info =
        document.createElement("div");

    info.className =
        "case-person-info";


    const name =
        document.createElement("h3");

    name.textContent =
        person.display_name ||
        "Unnamed Person";

    info.appendChild(
        name
    );


    /* -----------------------------------------
       ROLE
       ----------------------------------------- */

    const role =
        document.createElement("p");

    role.innerHTML =
        "<strong>Role:</strong> " +
        escapeHTML(
            entry.role ||
            "Unknown"
        );

    info.appendChild(
        role
    );


    /* -----------------------------------------
       AGE
       ----------------------------------------- */

    if (
        person.age_at_case !== null &&
        person.age_at_case !== undefined
    ) {

        const age =
            document.createElement("p");

        age.innerHTML =
            "<strong>Age at Case:</strong> " +
            escapeHTML(
                person.age_at_case
            );

        info.appendChild(
            age
        );
    }


    /* -----------------------------------------
       DATE OF BIRTH
       ----------------------------------------- */

    if (person.date_of_birth) {

        const dob =
            document.createElement("p");

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


    /* -----------------------------------------
       GENDER
       ----------------------------------------- */

    if (person.gender) {

        const gender =
            document.createElement("p");

        gender.innerHTML =
            "<strong>Gender:</strong> " +
            escapeHTML(
                person.gender
            );

        info.appendChild(
            gender
        );
    }


    /* =========================================
       CHARGES
       ========================================= */

    const chargesContainer =
        document.createElement("div");

    chargesContainer.className =
        "case-person-charges";


    const chargesHeading =
        document.createElement("p");

    chargesHeading.innerHTML =
        "<strong>Charges:</strong>";

    chargesContainer.appendChild(
        chargesHeading
    );


    if (charges.length === 0) {

        const noCharges =
            document.createElement("p");

        noCharges.className =
            "empty-message";

        noCharges.textContent =
            "No charges assigned to this person.";

        chargesContainer.appendChild(
            noCharges
        );

    } else {

        const chargeList =
            document.createElement("ul");

        chargeList.className =
            "case-person-charge-list";


        charges.forEach(
            function(charge) {

                const listItem =
                    document.createElement("li");


                const chargeName =
                    document.createElement("span");

                chargeName.textContent =
                    getOffenseName(
                        charge.offense_id
                    );


                listItem.appendChild(
                    chargeName
                );


                /*
                 * Remove charge button
                 */

                const removeChargeButton =
                    document.createElement(
                        "button"
                    );

                removeChargeButton.type =
                    "button";

                removeChargeButton.textContent =
                    "Remove";

                removeChargeButton.className =
                    "danger";


                removeChargeButton.style.marginLeft =
                    "0.5rem";


                removeChargeButton.addEventListener(
                    "click",
                    async function() {

                        await removePersonCharge(
                            charge.id
                        );
                    }
                );


                listItem.appendChild(
                    removeChargeButton
                );


                chargeList.appendChild(
                    listItem
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
        document.createElement("div");

    buttons.className =
        "case-person-buttons";


    /* -----------------------------------------
       VIEW PERSON
       ----------------------------------------- */

    const viewButton =
        document.createElement("button");

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


    /* -----------------------------------------
       EDIT CHARGES
       ----------------------------------------- */

    const editChargesButton =
        document.createElement("button");

    editChargesButton.type =
        "button";

    editChargesButton.textContent =
        "Edit Charges";


    editChargesButton.addEventListener(
        "click",
        function() {

            openPersonChargeEditor(
                entry,
                chargeIds,
                casePrimaryOffenseId
            );
        }
    );


    /* -----------------------------------------
       REMOVE PERSON
       ----------------------------------------- */

    const removeButton =
        document.createElement("button");

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
        editChargesButton
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
   ADD PERSON
   ========================================= */

async function addPerson(event) {

    if (event) {
        event.preventDefault();
    }


    const caseId =
        getCurrentCaseId();


    console.log(
        "ADD PERSON DEBUG — case ID:",
        caseId
    );


    if (!caseId) {

        showCasePersonMessage(
            "Please select a case first.",
            "error"
        );

        return;
    }


    const currentPersonSelector =
        document.getElementById(
            "person-selector"
        );


    const currentPersonRole =
        document.getElementById(
            "person-role"
        );


    const personId =
        currentPersonSelector?.value;


    const role =
        currentPersonRole?.value.trim();


    if (!personId) {

        showCasePersonMessage(
            "Please select a person.",
            "error"
        );

        return;
    }


    const finalRole =
        role || "Unknown";


    console.log(
        "ADDING PERSON:",
        {
            caseId,
            personId,
            role: finalRole
        }
    );


    /* -----------------------------------------
       INSERT CASE PERSON
       ----------------------------------------- */

    const {
        data,
        error
    } = await peopleSupabase
        .from("case_people")
        .insert({
            case_id: caseId,
            person_id: personId,
            role: finalRole
        })
        .select()
        .single();


    if (error) {

        console.error(
            "Error adding person to case:",
            error
        );


        if (error.code === "23505") {

            showCasePersonMessage(
                "This person is already attached to this case.",
                "error"
            );

        } else {

            showCasePersonMessage(
                "Unable to add person: " +
                error.message,
                "error"
            );
        }

        return;
    }


    console.log(
        "PERSON ATTACHED SUCCESSFULLY:",
        data
    );


    /* -----------------------------------------
       GET CHARGES
       ----------------------------------------- */

    const offenseIds =
        getSelectedPersonOffenseIds();


    /* -----------------------------------------
       SAVE PERSON CHARGES
       ----------------------------------------- */

    if (offenseIds.length > 0) {

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
        } = await peopleSupabase
            .from("case_person_offenses")
            .insert(
                chargeRows
            );


        if (chargeError) {

            console.error(
                "Person added but charges could not be saved:",
                chargeError
            );


            showCasePersonMessage(
                "Person added, but the charges could not be saved: " +
                chargeError.message,
                "error"
            );


            await loadPeople(
                caseId
            );

            return;
        }
    }


    /* -----------------------------------------
       SUCCESS
       ----------------------------------------- */

    showCasePersonMessage(
        "Person and charges added successfully.",
        "success"
    );


    const form =
        document.getElementById(
            "case-person-form"
        );


    if (form) {
        form.reset();
    }


    await loadPeopleSelector(
        caseId
    );

    await loadPeople(
        caseId
    );
}


/* =========================================
   OPEN PERSON CHARGE EDITOR
   ========================================= */

async function openPersonChargeEditor(
    entry,
    existingChargeIds,
    casePrimaryOffenseId
) {

    const existingEditor =
        document.getElementById(
            "person-charge-editor"
        );


    if (existingEditor) {
        existingEditor.remove();
    }


    const editor =
        document.createElement("div");

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
        peopleDisplay.children[1] ||
        null
    );


    const primarySelector =
        document.getElementById(
            "edit-person-primary-offense"
        );


    const additionalSelector =
        document.getElementById(
            "edit-person-additional-offenses"
        );


    casePersonOffenses.forEach(
        function(offense) {

            const name =
                formatOffenseName(
                    offense.name
                );


            const primaryOption =
                document.createElement(
                    "option"
                );

            primaryOption.value =
                offense.id;

            primaryOption.textContent =
                name;

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
                name;

            additionalSelector.appendChild(
                additionalOption
            );
        }
    );


    setPersonOffenseSelectorsForEditor(
        existingChargeIds,
        casePrimaryOffenseId,
        primarySelector,
        additionalSelector
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
   SET EDITOR OFFENSE VALUES
   ========================================= */

function setPersonOffenseSelectorsForEditor(
    offenseIds,
    casePrimaryOffenseId,
    primarySelector,
    additionalSelector
) {

    const ids =
        (offenseIds || [])
            .map(
                function(id) {
                    return String(id);
                }
            );


    if (
        casePrimaryOffenseId !== null &&
        casePrimaryOffenseId !== undefined &&
        ids.includes(
            String(casePrimaryOffenseId)
        )
    ) {

        primarySelector.value =
            String(casePrimaryOffenseId);

        ids.splice(
            ids.indexOf(
                String(casePrimaryOffenseId)
            ),
            1
        );

    } else if (ids.length > 0) {

        /*
         * If the case primary offense wasn't
         * assigned to this person, use the first
         * assigned offense as the person's primary.
         */

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

                        return String(item.value) ===
                            String(id);
                    }
                );


            if (option) {
                option.selected = true;
            }
        }
    );
}


/* =========================================
   SAVE PERSON CHARGES
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
        [];


    /* PRIMARY */

    if (
        primarySelector &&
        primarySelector.value
    ) {

        offenseIds.push(
            String(
                primarySelector.value
            )
        );
    }


    /* ADDITIONAL */

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
                    !offenseIds.includes(
                        id
                    )
                ) {

                    offenseIds.push(
                        id
                    );
                }
            }
        );
    }


    /* -----------------------------------------
       DELETE EXISTING CHARGES
       ----------------------------------------- */

    const {
        error: deleteError
    } = await peopleSupabase
        .from("case_person_offenses")
        .delete()
        .eq(
            "case_people_id",
            casePeopleId
        );


    if (deleteError) {

        console.error(
            "Error deleting existing person charges:",
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


    /* -----------------------------------------
       INSERT NEW CHARGES
       ----------------------------------------- */

    if (offenseIds.length > 0) {

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
        } = await peopleSupabase
            .from("case_person_offenses")
            .insert(
                rows
            );


        if (insertError) {

            console.error(
                "Error saving person charges:",
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


    /* -----------------------------------------
       SUCCESS
       ----------------------------------------- */

    if (message) {

        message.textContent =
            "Charges updated successfully.";

        message.className =
            "manage-message success";
    }


    const caseId =
        getCurrentCaseId();


    if (caseId) {

        await loadPeople(
            caseId
        );
    }
}


/* =========================================
   REMOVE INDIVIDUAL PERSON CHARGE
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
    } = await peopleSupabase
        .from("case_person_offenses")
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

        await loadPeople(
            caseId
        );
    }
}


/* =========================================
   CREATE NEW PERSON
   ========================================= */

async function createPerson(event) {

    if (event) {
        event.preventDefault();
    }


    console.log(
        "CREATE PERSON STARTED"
    );


    const nameInput =
        document.getElementById(
            "new-person-name"
        );

    const ageInput =
        document.getElementById(
            "new-person-age"
        );

    const genderInput =
        document.getElementById(
            "new-person-gender"
        );

    const dobInput =
        document.getElementById(
            "new-person-dob"
        );


    const displayName =
        nameInput?.value.trim() ||
        "";


    const age =
        ageInput?.value
            ? Number(
                ageInput.value
            )
            : null;


    const gender =
        genderInput?.value.trim() ||
        "";


    const dateOfBirth =
        dobInput?.value ||
        "";


    if (!displayName) {

        alert(
            "Please enter a person's name."
        );

        return;
    }


    const caseId =
        getCurrentCaseId();


    console.log(
        "CREATE PERSON DEBUG:",
        {
            displayName,
            age,
            gender,
            dateOfBirth,
            caseId
        }
    );


    /* -----------------------------------------
       CREATE PERSON
       ----------------------------------------- */

    const {
        data,
        error
    } = await peopleSupabase
        .from("people")
        .insert({
            display_name:
                displayName,

            age_at_case:
                age,

            gender:
                gender || null,

            date_of_birth:
                dateOfBirth || null
        })
        .select()
        .single();


    if (error) {

        console.error(
            "ERROR CREATING PERSON:",
            error
        );

        alert(
            "Unable to create person:\n\n" +
            error.message
        );

        return;
    }


    console.log(
        "PERSON CREATED:",
        data
    );


    if (!data || !data.id) {

        console.error(
            "Person insert succeeded but no person ID was returned.",
            data
        );

        alert(
            "The person was created, but CBRA did not receive the person's ID."
        );

        return;
    }


    /* =========================================
       ATTACH NEW PERSON TO CASE
       ========================================= */

    if (!caseId) {

        console.error(
            "NO CASE ID FOUND."
        );


        alert(
            "The person was created successfully, but CBRA could not determine the current case.\n\n" +
            "The person is now available in the People dropdown."
        );


        await loadPeopleSelector(
            null
        );


        return;
    }


    const currentPersonRole =
        document.getElementById(
            "person-role"
        );


    const finalRole =
        currentPersonRole?.value.trim() ||
        "Unknown";


    console.log(
        "ATTACHING NEW PERSON TO CASE:",
        {
            caseId,
            personId: data.id,
            role: finalRole
        }
    );


    const {
        data: casePersonData,
        error: casePersonError
    } = await peopleSupabase
        .from("case_people")
        .insert({
            case_id:
                caseId,

            person_id:
                data.id,

            role:
                finalRole
        })
        .select(`
            id,
            case_id,
            person_id,
            role
        `)
        .single();


    if (casePersonError) {

        console.error(
            "PERSON CREATED BUT CASE CONNECTION FAILED:",
            casePersonError
        );


        alert(
            "The person was created, but could not be attached to the case.\n\n" +
            "Error: " +
            casePersonError.message
        );


        await loadPeopleSelector(
            caseId
        );

        return;
    }


    console.log(
        "PERSON ATTACHED SUCCESSFULLY:",
        casePersonData
    );


    /* -----------------------------------------
       GET CHARGES FROM FORM
       ----------------------------------------- */

    const offenseIds =
        getSelectedPersonOffenseIds();


    /* -----------------------------------------
       SAVE CHARGES
       ----------------------------------------- */

    if (offenseIds.length > 0) {

        const chargeRows =
            offenseIds.map(
                function(offenseId) {

                    return {
                        case_people_id:
                            casePersonData.id,

                        offense_id:
                            offenseId
                    };
                }
            );


        const {
            error: chargeError
        } = await peopleSupabase
            .from("case_person_offenses")
            .insert(
                chargeRows
            );


        if (chargeError) {

            console.error(
                "Person attached but charges failed:",
                chargeError
            );


            alert(
                "The person was added to the case, but the charges could not be saved.\n\n" +
                "Error: " +
                chargeError.message
            );
        }
    }


    showCasePersonMessage(
        "Person created, attached, and charges saved.",
        "success"
    );


    /* -----------------------------------------
       RESET NEW PERSON FORM
       ----------------------------------------- */

    if (newPersonForm) {

        newPersonForm.reset();

    } else {

        if (nameInput) {
            nameInput.value = "";
        }

        if (ageInput) {
            ageInput.value = "";
        }

        if (genderInput) {
            genderInput.value = "";
        }

        if (dobInput) {
            dobInput.value = "";
        }
    }


    if (currentPersonRole) {
        currentPersonRole.value = "";
    }


    const personForm =
        document.getElementById(
            "case-person-form"
        );


    if (personForm) {
        personForm.reset();
    }


    await loadPeopleSelector(
        caseId
    );

    await loadPeople(
        caseId
    );
}


/* =========================================
   REMOVE PERSON FROM CASE
   ========================================= */

async function removePersonFromCase(
    casePersonId
) {

    if (!casePersonId) {
        return;
    }


    const confirmed =
        confirm(
            "Remove this person from the case?"
        );


    if (!confirmed) {
        return;
    }


    /*
     * case_person_offenses uses
     * ON DELETE CASCADE if configured.
     *
     * We also explicitly delete the
     * charges first so this works even
     * if cascade behavior differs.
     */

    const {
        error: chargeDeleteError
    } = await peopleSupabase
        .from("case_person_offenses")
        .delete()
        .eq(
            "case_people_id",
            casePersonId
        );


    if (chargeDeleteError) {

        console.error(
            "Error removing person charges:",
            chargeDeleteError
        );

        alert(
            "Unable to remove the person's charges:\n\n" +
            chargeDeleteError.message
        );

        return;
    }


    const {
        error
    } = await peopleSupabase
        .from("case_people")
        .delete()
        .eq(
            "id",
            casePersonId
        );


    if (error) {

        console.error(
            "Error removing person from case:",
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

        await loadPeople(
            caseId
        );

        await loadPeopleSelector(
            caseId
        );
    }


    showCasePersonMessage(
        "Person removed from case.",
        "success"
    );
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
   REFRESH PEOPLE
   ========================================= */

async function refreshPeopleForCase(
    caseId
) {

    if (!caseId) {

        caseId =
            getCurrentCaseId();
    }


    if (!caseId) {

        console.warn(
            "refreshPeopleForCase: no case ID."
        );

        return;
    }


    await loadCasePersonOffenses();

    await loadPeopleSelector(
        caseId
    );

    await loadPeople(
        caseId
    );
}


/* =========================================
   INITIALIZE
   ========================================= */

async function initializeManagePeople() {

    /*
     * The HTML page doesn't contain the
     * person form itself. We create it
     * when a case is loaded.
     */

    await loadCasePersonOffenses();


    /*
     * If another script already created
     * the form, connect its submit event.
     */

    const existingForm =
        document.getElementById(
            "case-person-form"
        );


    if (existingForm) {

        existingForm.addEventListener(
            "submit",
            addPerson
        );
    }


    /*
     * Existing new-person form.
     */

    const existingNewPersonForm =
        document.getElementById(
            "new-person-form"
        );


    if (existingNewPersonForm) {

        existingNewPersonForm.addEventListener(
            "submit",
            createPerson
        );
    }
}


/* =========================================
   EVENT LISTENERS
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
    addPerson;

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