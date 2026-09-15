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

    /*
     * Your Manage Cases page uses the case selector.
     * We check several common possibilities so this
     * works even if the selector is loaded slightly
     * differently.
     */

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

            /*
             * Keep UUID/string IDs intact.
             * If the database uses an integer ID,
             * convert it to a number.
             */

            if (/^\d+$/.test(value)) {
                return Number(value);
            }

            return value;
        }
    }


    /*
     * Fallback: look for a select whose name/id
     * contains "case".
     */

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


/* -----------------------------------------
   MESSAGE HELPERS
   ----------------------------------------- */

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


/* -----------------------------------------
   ESCAPE HTML
   ----------------------------------------- */

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


/* -----------------------------------------
   FORMAT DATE
   ----------------------------------------- */

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


    if (
        !data ||
        data.length === 0
    ) {

        casePeopleList.innerHTML =
            "<p>No people are connected to this case yet.</p>";

        return;
    }


    casePeopleList.innerHTML = "";


    data.forEach(
        function(entry) {

            const person =
                entry.people;


            if (!person) {
                return;
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


            /* VIEW PERSON */

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


            /* REMOVE */

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
                removeButton
            );


            wrapper.appendChild(
                buttons
            );


            casePeopleList.appendChild(
                wrapper
            );
        }
    );
}


/* =========================================
   ADD EXISTING PERSON TO CASE
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


    const personId =
        personSelector?.value;


    const role =
        personRole?.value.trim();


    if (!personId) {

        showCasePersonMessage(
            "Please select a person.",
            "error"
        );

        return;
    }


    /*
     * case_people.role is NOT NULL.
     * Use Unknown if no role was supplied.
     */

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


    showCasePersonMessage(
        "Person added to case.",
        "success"
    );


    if (casePersonForm) {
        casePersonForm.reset();
    }


    await loadPeopleSelector(
        caseId
    );

    await loadPeople(
        caseId
    );
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


    /* -----------------------------------------
       INPUTS
       ----------------------------------------- */

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


    /* -----------------------------------------
       VALIDATE NAME
       ----------------------------------------- */

    if (!displayName) {

        alert(
            "Please enter a person's name."
        );

        return;
    }


    /* -----------------------------------------
       GET CASE ID BEFORE INSERTING PERSON
       ----------------------------------------- */

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


    /* -----------------------------------------
       MAKE SURE PERSON WAS CREATED
       ----------------------------------------- */

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


        /*
         * The person exists, but we don't know
         * which case to connect them to.
         */

        alert(
            "The person was created successfully, but CBRA could not determine the current case.\n\n" +
            "The person is now available in the People dropdown."
        );


        /*
         * Refresh selector so the new person
         * appears immediately.
         */

        await loadPeopleSelector(
            null
        );


        return;
    }


    /*
     * case_people.role is NOT NULL.
     */

    const finalRole =
        personRole?.value.trim() ||
        "Unknown";


    console.log(
        "ATTACHING NEW PERSON TO CASE:",
        {
            caseId: caseId,
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


    /* -----------------------------------------
       CASE CONNECTION ERROR
       ----------------------------------------- */

    if (casePersonError) {

        console.error(
            "PERSON CREATED BUT CASE CONNECTION FAILED:",
            casePersonError
        );


        console.error(
            "Connection attempt used:",
            {
                caseId:
                    caseId,

                personId:
                    data.id,

                role:
                    finalRole
            }
        );


        alert(
            "The person was created, but could not be attached to the case.\n\n" +
            "Error: " +
            casePersonError.message
        );


        /*
         * The person remains in the people table,
         * which is why it will appear in the dropdown.
         */

        await loadPeopleSelector(
            caseId
        );

        return;
    }


    /* -----------------------------------------
       CONNECTION SUCCESS
       ----------------------------------------- */

    console.log(
        "PERSON ATTACHED SUCCESSFULLY:",
        casePersonData
    );


    showCasePersonMessage(
        "Person created and attached to this case.",
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


    /* -----------------------------------------
       CLEAR ROLE
       ----------------------------------------- */

    if (personRole) {
        personRole.value = "";
    }


    /* -----------------------------------------
       REFRESH EVERYTHING
       ----------------------------------------- */

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


    await loadPeopleSelector(
        caseId
    );

    await loadPeople(
        caseId
    );
}


/* =========================================
   EVENT LISTENERS
   ========================================= */


/* -----------------------------------------
   EXISTING PERSON FORM
   ----------------------------------------- */

if (casePersonForm) {

    casePersonForm.addEventListener(
        "submit",
        addPerson
    );
}


/* -----------------------------------------
   NEW PERSON FORM
   ----------------------------------------- */

if (newPersonForm) {

    newPersonForm.addEventListener(
        "submit",
        createPerson
    );
}


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

window.viewPerson =
    viewPerson;

window.refreshPeopleForCase =
    refreshPeopleForCase;