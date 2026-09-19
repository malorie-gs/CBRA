/* =========================================
   CBRA — MANAGE PERSON
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
   ADMIN
   ----------------------------------------- */

const CBRA_ADMIN_USER_ID =
    "b8d830af-7439-4866-97e7-0634121daca4";

let CBRA_IS_ADMIN = false;


/* -----------------------------------------
   STATE
   ----------------------------------------- */

let currentPersonId = null;


/* -----------------------------------------
   SOURCE TYPES
   ----------------------------------------- */

const PERSON_SOURCE_TYPES = [
    "News Article",
    "Court Filing",
    "Court Record",
    "Government Record",
    "Police Record",
    "Academic Source",
    "Book",
    "Interview",
    "Other"
];


/* =========================================
   DOM READY
   ========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    await checkAdmin();

    await loadPeopleSelector();

    /*
       Management forms are ONLY created
       for the admin.
    */

    if (CBRA_IS_ADMIN) {

        createSourceManagementForm();
        createDocumentManagementForm();

    }

    setupPersonSelector();
    setupPersonForm();
    setupLoginForm();
    setupLogoutButton();
    setupMugshotForm();

    updateAdminInterface();

});


/* =========================================
   ADMIN CHECK
   ========================================= */

async function checkAdmin() {

    try {

        const {
            data: {
                user
            },
            error
        } = await supabaseClient.auth.getUser();


        if (error || !user) {

            CBRA_IS_ADMIN = false;

            return;

        }


        CBRA_IS_ADMIN =
            user.id === CBRA_ADMIN_USER_ID;


    } catch (error) {

        console.error(
            "Admin check failed:",
            error
        );

        CBRA_IS_ADMIN = false;

    }

}


/* =========================================
   ADMIN INTERFACE
   ========================================= */

function updateAdminInterface() {

    /*
       Person edit form
    */

    const personForm =
        document.getElementById(
            "person-form"
        );

    if (personForm) {

        personForm.style.display =
            CBRA_IS_ADMIN
                ? ""
                : "none";

    }


    /*
       Static management containers that
       may exist in Manage Person HTML.
    */

    const adminContainers = [

        "person-mugshot-form",
        "person-mugshots-form",
        "person-document-form",
        "person-source-form"

    ];


    adminContainers.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) return;

        element.style.display =
            CBRA_IS_ADMIN
                ? ""
                : "none";

    });


    /*
       Admin-only buttons already present
       in HTML.
    */

    const adminButtons = [

        "add-mugshot-button",
        "add-person-mugshot-button",
        "add-person-document-button",
        "add-person-source-button",
        "assign-person-source-button",
        "save-person-button"

    ];


    adminButtons.forEach(id => {

        const button =
            document.getElementById(id);

        if (!button) return;

        button.style.display =
            CBRA_IS_ADMIN
                ? ""
                : "none";

    });

}


/* =========================================
   PEOPLE SELECTOR
   ========================================= */

async function loadPeopleSelector() {

    const selector =
        document.getElementById(
            "person-selector"
        );

    if (!selector) return;


    selector.innerHTML =
        '<option value="">Select a person...</option>';


    const {
        data,
        error
    } = await supabaseClient
        .from("people")
        .select("id, display_name")
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

        return;

    }


    (data || []).forEach(person => {

        const option =
            document.createElement("option");


        option.value =
            person.id;


        option.textContent =
            person.display_name ||
            "Unnamed Person";


        selector.appendChild(
            option
        );

    });

}


/* =========================================
   PERSON SELECTOR
   ========================================= */

function setupPersonSelector() {

    const selector =
        document.getElementById(
            "person-selector"
        );

    if (!selector) return;


    selector.addEventListener(
        "change",
        async function () {

            const personId =
                this.value;


            if (!personId) {

                currentPersonId =
                    null;

                updateCurrentPersonId();

                clearPersonManagement();

                return;

            }


            currentPersonId =
                Number(personId);


            updateCurrentPersonId();


            await loadPerson(
                currentPersonId
            );

        }
    );

}


/* =========================================
   CURRENT PERSON ID
   ========================================= */

function updateCurrentPersonId() {

    /*
       Keep global reference synchronized.
    */

    window.currentPersonId =
        currentPersonId;

}


/* =========================================
   LOAD PERSON
   ========================================= */

async function loadPerson(personId) {

    const {
        data,
        error
    } = await supabaseClient
        .from("people")
        .select("*")
        .eq(
            "id",
            personId
        )
        .single();


    if (error) {

        console.error(
            "Error loading person:",
            error
        );

        return;

    }


    if (!data) return;


    setValue(
        "person-display-name",
        data.display_name
    );


    setValue(
        "person-age",
        data.age_at_case
    );


    setValue(
        "person-gender",
        data.gender
    );


    setValue(
        "person-date-of-birth",
        data.date_of_birth
    );


    await loadPersonCases(
        personId
    );


    await loadPersonSources(
        personId
    );


    await loadPersonMugshots(
        personId
    );


    if (
        typeof loadPersonDocuments ===
        "function"
    ) {

        await loadPersonDocuments(
            personId
        );

    }

}


/* =========================================
   CLEAR PERSON
   ========================================= */

function clearPersonManagement() {

    const fields = [

        "person-display-name",
        "person-age",
        "person-gender",
        "person-date-of-birth"

    ];


    fields.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.value =
                "";

        }

    });


    const cases =
        document.getElementById(
            "person-cases-management"
        );


    if (cases) {

        cases.innerHTML =
            "<p>Select a person to view their cases.</p>";

    }


    const sources =
        document.getElementById(
            "person-sources-management"
        );


    if (sources) {

        if (CBRA_IS_ADMIN) {

            sources.innerHTML = "";

            createSourceManagementForm();

        } else {

            sources.innerHTML =
                "<p>Select a person to view their sources.</p>";

        }

    }


    const mugshots =
        document.getElementById(
            "person-mugshots-management"
        );


    if (mugshots) {

        mugshots.innerHTML =
            "<p>Select a person to view their mugshots.</p>";

    }


    const documents =
        document.getElementById(
            "person-documents-management"
        );


    if (documents) {

        if (CBRA_IS_ADMIN) {

            documents.innerHTML = "";

            createDocumentManagementForm();

        } else {

            documents.innerHTML =
                "<p>Select a person to view their documents.</p>";

        }

    }

}


/* =========================================
   PERSON FORM
   ========================================= */

function setupPersonForm() {

    const form =
        document.getElementById(
            "person-form"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /*
               Frontend protection.
               RLS remains the actual security.
            */

            if (!CBRA_IS_ADMIN) {

                setMessage(
                    "person-message",
                    "You do not have permission to edit people."
                );

                return;

            }


            if (!currentPersonId) {

                setMessage(
                    "person-message",
                    "Please select a person first."
                );

                return;

            }


            const displayName =
                getValue(
                    "person-display-name"
                );


            const age =
                getValue(
                    "person-age"
                );


            const gender =
                getValue(
                    "person-gender"
                );


            const dateOfBirth =
                getValue(
                    "person-date-of-birth"
                );


            const {
                error
            } = await supabaseClient
                .from("people")
                .update({

                    display_name:
                        displayName || null,

                    age_at_case:
                        age
                            ? Number(age)
                            : null,

                    gender:
                        gender || null,

                    date_of_birth:
                        dateOfBirth || null

                })
                .eq(
                    "id",
                    currentPersonId
                );


            if (error) {

                console.error(
                    "Error updating person:",
                    error
                );


                setMessage(
                    "person-message",
                    "Could not save person."
                );


                return;

            }


            setMessage(
                "person-message",
                "Person saved."
            );


            await loadPeopleSelector();


            const selector =
                document.getElementById(
                    "person-selector"
                );


            if (selector) {

                selector.value =
                    currentPersonId;

            }

        }
    );

}


/* =========================================
   CASES
   ========================================= */

async function loadPersonCases(personId) {

    const container =
        document.getElementById(
            "person-cases-management"
        );


    if (!container) return;


    container.innerHTML =
        "<p>Loading cases...</p>";


    const {
        data,
        error
    } = await supabaseClient
        .from("case_people")
        .select(`
            id,
            role,
            cases (
                id,
                case_name,
                case_date,
                city,
                state_province,
                offense,
                classification,
                outcome
            )
        `)
        .eq(
            "person_id",
            personId
        );


    if (error) {

        console.error(
            "Error loading person cases:",
            error
        );


        container.innerHTML =
            "<p>Could not load cases.</p>";


        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "<p>This person is not connected to any cases.</p>";


        return;

    }


    container.innerHTML =
        "";


    data.forEach(connection => {

        const caseData =
            connection.cases;


        if (!caseData) return;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "management-card";


        const title =
            escapeHTML(
                caseData.case_name ||
                "Unnamed Case"
            );


        const role =
            escapeHTML(
                connection.role ||
                "Role not specified"
            );


        const location = [

            caseData.city,
            caseData.state_province

        ]
            .filter(Boolean)
            .map(escapeHTML)
            .join(", ");


        const date =
            caseData.case_date
                ? escapeHTML(
                    caseData.case_date
                )
                : "";


        const offense =
            caseData.offense
                ? escapeHTML(
                    caseData.offense
                )
                : "";


        const classification =
            caseData.classification
                ? escapeHTML(
                    caseData.classification
                )
                : "";


        const outcome =
            caseData.outcome
                ? escapeHTML(
                    caseData.outcome
                )
                : "";


        card.innerHTML = `

            <h3>${title}</h3>

            <p>
                <strong>Role:</strong>
                ${role}
            </p>

            ${
                date
                    ? `
                    <p>
                        <strong>Date:</strong>
                        ${date}
                    </p>
                    `
                    : ""
            }

            ${
                location
                    ? `
                    <p>
                        <strong>Location:</strong>
                        ${location}
                    </p>
                    `
                    : ""
            }

            ${
                classification
                    ? `
                    <p>
                        <strong>Classification:</strong>
                        ${classification}
                    </p>
                    `
                    : ""
            }

            ${
                offense
                    ? `
                    <p>
                        <strong>Offense:</strong>
                        ${offense}
                    </p>
                    `
                    : ""
            }

            ${
                outcome
                    ? `
                    <p>
                        <strong>Outcome:</strong>
                        ${outcome}
                    </p>
                    `
                    : ""
            }

            <a
                href="manage.html?case=${encodeURIComponent(
                    caseData.id
                )}"
            >
                Manage Case
            </a>

        `;


        container.appendChild(
            card
        );

    });

}


/* =========================================
   SOURCE MANAGEMENT UI
   ========================================= */

function createSourceManagementForm() {

    /*
       NEVER create this interface for
       non-admin users.
    */

    if (!CBRA_IS_ADMIN) {
        return;
    }


    const container =
        document.getElementById(
            "person-sources-management"
        );


    if (!container) return;


    /*
       Prevent duplicate forms.
    */

    if (
        document.getElementById(
            "person-source-form"
        )
    ) {

        return;

    }


    container.innerHTML = `

        <div id="person-source-form">

            <h3>Assign Existing Source</h3>

            <p>
                Attach an existing source from one
                of this person's cases.
            </p>

            <div class="form-group">

                <label for="person-existing-source">
                    Existing Source
                </label>

                <select
                    id="person-existing-source"
                >

                    <option value="">
                        Select a source...
                    </option>

                </select>

            </div>

            <button
                type="button"
                id="assign-person-source-button"
            >
                Assign Source
            </button>


            <hr>


            <h3>Create New Source</h3>

            <div class="form-group">

                <label for="person-source-case">
                    Case
                </label>

                <select
                    id="person-source-case"
                >

                    <option value="">
                        Select a case...
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label for="person-source-title">
                    Title
                </label>

                <input
                    type="text"
                    id="person-source-title"
                    placeholder="Source title"
                >

            </div>


            <div class="form-group">

                <label for="person-source-type">
                    Source Type
                </label>

                <select
                    id="person-source-type"
                >

                    <option value="">
                        Select source type...
                    </option>

                    ${PERSON_SOURCE_TYPES
                        .map(type => `
                            <option value="${escapeAttribute(type)}">
                                ${escapeHTML(type)}
                            </option>
                        `)
                        .join("")}

                </select>

            </div>


            <div class="form-group">

                <label for="person-source-date">
                    Publication Date
                </label>

                <input
                    type="date"
                    id="person-source-date"
                >

            </div>


            <div class="form-group">

                <label for="person-source-url">
                    URL
                </label>

                <input
                    type="url"
                    id="person-source-url"
                    placeholder="https://..."
                >

            </div>


            <button
                type="button"
                id="add-person-source-button"
            >
                Add Source
            </button>


            <p
                id="person-source-message"
            ></p>


            <hr>


            <h3>Linked Sources</h3>

            <div
                id="person-sources-list"
            >
                <p>Loading sources...</p>
            </div>

        </div>

    `;


    const assignButton =
        document.getElementById(
            "assign-person-source-button"
        );


    if (assignButton) {

        assignButton.addEventListener(
            "click",
            assignExistingSourceToPerson
        );

    }


    const addButton =
        document.getElementById(
            "add-person-source-button"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            addPersonSource
        );

    }

}


/* =========================================
   LOAD PERSON SOURCE CASES
   ========================================= */

async function loadPersonSourceCases(
    personId
) {

    if (!CBRA_IS_ADMIN) return;


    const selector =
        document.getElementById(
            "person-source-case"
        );


    if (!selector) return;


    selector.innerHTML =
        '<option value="">Select a case...</option>';


    const {
        data,
        error
    } = await supabaseClient
        .from("case_people")
        .select(`
            case_id,
            cases (
                id,
                case_name,
                case_date,
                city,
                state_province
            )
        `)
        .eq(
            "person_id",
            personId
        );


    if (error) {

        console.error(
            "Error loading person source cases:",
            error
        );

        return;

    }


    (data || []).forEach(connection => {

        const caseData =
            connection.cases;


        if (!caseData) return;


        const option =
            document.createElement(
                "option"
            );


        option.value =
            caseData.id;


        let label =
            caseData.case_name ||
            "Unnamed Case";


        if (caseData.case_date) {

            label +=
                ` (${caseData.case_date})`;

        }


        option.textContent =
            label;


        selector.appendChild(
            option
        );

    });

}


/* =========================================
   LOAD EXISTING SOURCES
   ========================================= */

async function loadExistingSourcesForPerson(
    personId
) {

    if (!CBRA_IS_ADMIN) return;


    const selector =
        document.getElementById(
            "person-existing-source"
        );


    if (!selector) return;


    selector.innerHTML =
        '<option value="">Select a source...</option>';


    const {
        data: caseConnections,
        error: caseError
    } = await supabaseClient
        .from("case_people")
        .select("case_id")
        .eq(
            "person_id",
            personId
        );


    if (caseError) {

        console.error(
            "Error loading person's cases:",
            caseError
        );

        return;

    }


    const caseIds =
        (caseConnections || [])
            .map(row =>
                Number(row.case_id)
            )
            .filter(Boolean);


    if (caseIds.length === 0) {

        return;

    }


    /*
       Existing source architecture still uses
       sources.case_id here.

       This is intentional for compatibility
       with your current source system.
    */

    const {
        data: sources,
        error: sourceError
    } = await supabaseClient
        .from("sources")
        .select(`
            id,
            title,
            source_type,
            publication_date,
            case_id
        `)
        .in(
            "case_id",
            caseIds
        )
        .order(
            "publication_date",
            {
                ascending: false,
                nullsFirst: false
            }
        );


    if (sourceError) {

        console.error(
            "Error loading existing sources:",
            sourceError
        );

        return;

    }


    const {
        data: linkedSources,
        error: linkedError
    } = await supabaseClient
        .from("source_people")
        .select("source_id")
        .eq(
            "person_id",
            personId
        );


    if (linkedError) {

        console.error(
            "Error loading linked sources:",
            linkedError
        );

        return;

    }


    const linkedIds =
        new Set(
            (linkedSources || [])
                .map(row =>
                    Number(row.source_id)
                )
        );


    (sources || []).forEach(source => {

        if (
            linkedIds.has(
                Number(source.id)
            )
        ) {

            return;

        }


        const option =
            document.createElement(
                "option"
            );


        option.value =
            source.id;


        let label =
            source.title ||
            "Untitled Source";


        if (source.source_type) {

            label +=
                ` — ${source.source_type}`;

        }


        if (source.publication_date) {

            label +=
                ` (${source.publication_date})`;

        }


        option.textContent =
            label;


        selector.appendChild(
            option
        );

    });

}


/* =========================================
   LOAD PERSON SOURCES
   ========================================= */

async function loadPersonSources(
    personId
) {

    /*
       Only create the management interface
       for the admin.
    */

    if (CBRA_IS_ADMIN) {

        let form =
            document.getElementById(
                "person-source-form"
            );


        if (!form) {

            createSourceManagementForm();

        }


        await loadPersonSourceCases(
            personId
        );


        await loadExistingSourcesForPerson(
            personId
        );

    }


    /*
       The linked source list itself is
       available to the admin management page.
    */

    const list =
        document.getElementById(
            "person-sources-list"
        );


    if (!list) {

        if (!CBRA_IS_ADMIN) return;

        return;

    }


    list.innerHTML =
        "<p>Loading sources...</p>";


    const {
        data,
        error
    } = await supabaseClient
        .from("source_people")
        .select(`
            source_id,
            sources (
                id,
                title,
                url,
                source_type,
                publication_date,
                case_id
            )
        `)
        .eq(
            "person_id",
            personId
        );


    if (error) {

        console.error(
            "Error loading person sources:",
            error
        );


        list.innerHTML =
            "<p>Could not load sources.</p>";


        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        list.innerHTML =
            "<p>No sources are linked to this person.</p>";


        return;

    }


    list.innerHTML =
        "";


    data.forEach(connection => {

        const source =
            connection.sources;


        if (!source) return;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "management-card";


        const title =
            escapeHTML(
                source.title ||
                "Untitled Source"
            );


        const type =
            escapeHTML(
                source.source_type ||
                "Other"
            );


        const date =
            source.publication_date
                ? escapeHTML(
                    source.publication_date
                )
                : "";


        const url =
            source.url
                ? escapeAttribute(
                    source.url
                )
                : "";


        card.innerHTML = `

            <h4>${title}</h4>

            <p>
                <strong>Type:</strong>
                ${type}
            </p>

            ${
                date
                    ? `
                    <p>
                        <strong>Date:</strong>
                        ${date}
                    </p>
                    `
                    : ""
            }

            ${
                source.url
                    ? `
                    <p>
                        <a
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open Source
                        </a>
                    </p>
                    `
                    : ""
            }

            ${
                CBRA_IS_ADMIN
                    ? `
                    <button
                        type="button"
                        onclick="removePersonSourceConnection(${Number(source.id)})"
                    >
                        Remove From Person
                    </button>
                    `
                    : ""
            }

        `;


        list.appendChild(
            card
        );

    });

}


/* =========================================
   ASSIGN EXISTING SOURCE
   ========================================= */

async function assignExistingSourceToPerson() {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (!currentPersonId) {

        setMessage(
            "person-source-message",
            "Select a person first."
        );

        return;

    }


    const selector =
        document.getElementById(
            "person-existing-source"
        );


    const sourceId =
        selector
            ? selector.value
            : "";


    if (!sourceId) {

        setMessage(
            "person-source-message",
            "Select a source first."
        );

        return;

    }


    const numericSourceId =
        Number(sourceId);


    const {
        data: existing,
        error: existingError
    } = await supabaseClient
        .from("source_people")
        .select("source_id")
        .eq(
            "source_id",
            numericSourceId
        )
        .eq(
            "person_id",
            currentPersonId
        )
        .maybeSingle();


    if (existingError) {

        console.error(
            "Error checking source connection:",
            existingError
        );

        return;

    }


    if (existing) {

        setMessage(
            "person-source-message",
            "This source is already linked to this person."
        );

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("source_people")
        .insert({

            source_id:
                numericSourceId,

            person_id:
                currentPersonId

        });


    if (error) {

        console.error(
            "Error assigning source:",
            error
        );


        setMessage(
            "person-source-message",
            "Could not assign source."
        );


        return;

    }


    setMessage(
        "person-source-message",
        "Source assigned."
    );


    await loadPersonSources(
        currentPersonId
    );

}


/* =========================================
   ADD NEW PERSON SOURCE
   ========================================= */

async function addPersonSource() {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (!currentPersonId) {

        setMessage(
            "person-source-message",
            "Select a person first."
        );

        return;

    }


    const caseSelector =
        document.getElementById(
            "person-source-case"
        );


    const caseId =
        caseSelector
            ? caseSelector.value
            : "";


    const title =
        getValue(
            "person-source-title"
        );


    const sourceType =
        getValue(
            "person-source-type"
        );


    const publicationDate =
        getValue(
            "person-source-date"
        );


    const url =
        getValue(
            "person-source-url"
        );


    if (!caseId) {

        setMessage(
            "person-source-message",
            "Select a case for this source."
        );

        return;

    }


    if (!title) {

        setMessage(
            "person-source-message",
            "Enter a source title."
        );

        return;

    }


    if (!sourceType) {

        setMessage(
            "person-source-message",
            "Select a source type."
        );

        return;

    }


    const numericCaseId =
        Number(caseId);


    /*
       Create source with case_id for
       compatibility with Manage Cases.
    */

    const {
        data: source,
        error: sourceError
    } = await supabaseClient
        .from("sources")
        .insert({

            title:
                title,

            url:
                url || "",

            source_type:
                sourceType,

            publication_date:
                publicationDate || null,

            case_id:
                numericCaseId

        })
        .select()
        .single();


    if (sourceError) {

        console.error(
            "Error creating source:",
            sourceError
        );


        setMessage(
            "person-source-message",
            "Could not create source."
        );


        return;

    }


    /*
       Connect source to person.
    */

    const {
        error: relationshipError
    } = await supabaseClient
        .from("source_people")
        .insert({

            source_id:
                source.id,

            person_id:
                currentPersonId

        });


    if (relationshipError) {

        console.error(
            "Error connecting source to person:",
            relationshipError
        );


        /*
           Clean up orphan source.
        */

        await supabaseClient
            .from("sources")
            .delete()
            .eq(
                "id",
                source.id
            );


        setMessage(
            "person-source-message",
            "Source was created, but could not be connected to the person."
        );


        return;

    }


    /*
       Also connect the source through the
       central source_cases system.
    */

    const {
        error: caseRelationshipError
    } = await supabaseClient
        .from("source_cases")
        .insert({

            case_id:
                numericCaseId,

            source_id:
                source.id

        });


    /*
       If it already exists, PostgreSQL may
       reject the duplicate. The source itself
       is still valid, so don't delete it.
    */

    if (caseRelationshipError) {

        console.warn(
            "Source case relationship could not be created:",
            caseRelationshipError
        );

    }


    setMessage(
        "person-source-message",
        "Source added successfully."
    );


    setValue(
        "person-source-title",
        ""
    );


    setValue(
        "person-source-type",
        ""
    );


    setValue(
        "person-source-date",
        ""
    );


    setValue(
        "person-source-url",
        ""
    );


    await loadPersonSources(
        currentPersonId
    );


    /*
       Refresh Manage Cases source list
       if available.
    */

    if (
        typeof window.loadManageSources ===
        "function"
    ) {

        await window.loadManageSources(
            numericCaseId
        );

    }

}


/* =========================================
   REMOVE SOURCE FROM PERSON
   ========================================= */

async function removePersonSourceConnection(
    sourceId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (!currentPersonId) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("source_people")
        .delete()
        .eq(
            "source_id",
            Number(sourceId)
        )
        .eq(
            "person_id",
            currentPersonId
        );


    if (error) {

        console.error(
            "Error removing source connection:",
            error
        );

        return;

    }


    await loadPersonSources(
        currentPersonId
    );

}


/* =========================================
   PERSON MUGSHOTS
   ========================================= */

async function loadPersonMugshots(
    personId
) {

    const container =
        document.getElementById(
            "person-mugshots-management"
        );


    if (!container) return;


    container.innerHTML =
        "<p>Loading mugshots...</p>";


    const {
        data,
        error
    } = await supabaseClient
        .from("person_mugshots")
        .select("*")
        .eq(
            "person_id",
            personId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error loading mugshots:",
            error
        );


        container.innerHTML =
            "<p>Could not load mugshots.</p>";


        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "<p>No mugshots uploaded.</p>";


        return;

    }


    container.innerHTML =
        "";


    data.forEach(mugshot => {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "management-card";


        let imageUrl =
            mugshot.image_url ||
            mugshot.file_url ||
            "";


        card.innerHTML = `

            ${
                imageUrl
                    ? `
                    <img
                        src="${escapeAttribute(imageUrl)}"
                        alt="Mugshot"
                        style="max-width:200px;"
                    >
                    `
                    : ""
            }

            <p>
                ${
                    mugshot.caption
                        ? escapeHTML(
                            mugshot.caption
                        )
                        : "Mugshot"
                }
            </p>

        `;


        container.appendChild(
            card
        );

    });

}


/* =========================================
   MUGSHOT FORM
   ========================================= */

function setupMugshotForm() {

    /*
       Existing mugshot form logic is
       preserved if the HTML provides
       its own controls.

       Any actual write operation should
       still check CBRA_IS_ADMIN.
    */

}


/* =========================================
   DOCUMENT MANAGEMENT
   ========================================= */

function createDocumentManagementForm() {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const container =
        document.getElementById(
            "person-documents-management"
        );


    if (!container) return;


    /*
       Don't overwrite an existing form.
    */

    if (
        document.getElementById(
            "person-document-form"
        )
    ) {

        return;

    }


    container.innerHTML = `

        <div id="person-document-form">

            <h3>Add Person Document</h3>

            <div class="form-group">

                <label for="person-document-title">
                    Title
                </label>

                <input
                    type="text"
                    id="person-document-title"
                >

            </div>


            <div class="form-group">

                <label for="person-document-type">
                    Document Type
                </label>

                <input
                    type="text"
                    id="person-document-type"
                >

            </div>


            <div class="form-group">

                <label for="person-document-date">
                    Publication Date
                </label>

                <input
                    type="date"
                    id="person-document-date"
                >

            </div>


            <div class="form-group">

                <label for="person-document-url">
                    Document URL
                </label>

                <input
                    type="url"
                    id="person-document-url"
                >

            </div>


            <div class="form-group">

                <label for="person-document-description">
                    Description
                </label>

                <textarea
                    id="person-document-description"
                ></textarea>

            </div>


            <button
                type="button"
                id="add-person-document-button"
            >
                Add Document
            </button>


            <p
                id="person-document-message"
            ></p>


            <div
                id="person-documents-list"
            ></div>

        </div>

    `;


    const button =
        document.getElementById(
            "add-person-document-button"
        );


    if (button) {

        button.addEventListener(
            "click",
            addPersonDocument
        );

    }

}


/* =========================================
   LOAD PERSON DOCUMENTS
   ========================================= */

async function loadPersonDocuments(
    personId
) {

    const list =
        document.getElementById(
            "person-documents-list"
        );


    if (!list) return;


    list.innerHTML =
        "<p>Loading documents...</p>";


    const {
        data,
        error
    } = await supabaseClient
        .from("person_documents")
        .select("*")
        .eq(
            "person_id",
            personId
        )
        .order(
            "publication_date",
            {
                ascending: false,
                nullsFirst: false
            }
        );


    if (error) {

        console.error(
            "Error loading documents:",
            error
        );


        list.innerHTML =
            "<p>Could not load documents.</p>";


        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        list.innerHTML =
            "<p>No documents.</p>";


        return;

    }


    list.innerHTML =
        "";


    data.forEach(documentData => {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "management-card";


        card.innerHTML = `

            <h4>
                ${escapeHTML(
                    documentData.title ||
                    "Untitled Document"
                )}
            </h4>

            ${
                documentData.document_type
                    ? `
                    <p>
                        <strong>Type:</strong>
                        ${escapeHTML(
                            documentData.document_type
                        )}
                    </p>
                    `
                    : ""
            }

            ${
                documentData.publication_date
                    ? `
                    <p>
                        <strong>Date:</strong>
                        ${escapeHTML(
                            documentData.publication_date
                        )}
                    </p>
                    `
                    : ""
            }

            ${
                documentData.document_url
                    ? `
                    <p>
                        <a
                            href="${escapeAttribute(
                                documentData.document_url
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open Document
                        </a>
                    </p>
                    `
                    : ""
            }

        `;


        list.appendChild(
            card
        );

    });

}


/* =========================================
   ADD PERSON DOCUMENT
   ========================================= */

async function addPersonDocument() {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (!currentPersonId) {

        setMessage(
            "person-document-message",
            "Select a person first."
        );

        return;

    }


    const title =
        getValue(
            "person-document-title"
        );


    const documentType =
        getValue(
            "person-document-type"
        );


    const publicationDate =
        getValue(
            "person-document-date"
        );


    const documentUrl =
        getValue(
            "person-document-url"
        );


    const description =
        getValue(
            "person-document-description"
        );


    if (!title) {

        setMessage(
            "person-document-message",
            "Enter a document title."
        );

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("person_documents")
        .insert({

            person_id:
                currentPersonId,

            title:
                title,

            document_type:
                documentType || null,

            publication_date:
                publicationDate || null,

            document_url:
                documentUrl || null,

            description:
                description || null

        });


    if (error) {

        console.error(
            "Error adding document:",
            error
        );


        setMessage(
            "person-document-message",
            "Could not add document."
        );


        return;

    }


    setMessage(
        "person-document-message",
        "Document added."
    );


    setValue(
        "person-document-title",
        ""
    );


    setValue(
        "person-document-type",
        ""
    );


    setValue(
        "person-document-date",
        ""
    );


    setValue(
        "person-document-url",
        ""
    );


    setValue(
        "person-document-description",
        ""
    );


    await loadPersonDocuments(
        currentPersonId
    );

}


/* =========================================
   LOGIN
   ========================================= */

function setupLoginForm() {

    const form =
        document.getElementById(
            "login-form"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                getValue(
                    "login-email"
                );


            const password =
                getValue(
                    "login-password"
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

                setMessage(
                    "login-message",
                    error.message
                );


                return;

            }


            await checkAdmin();


            updateAdminInterface();


            /*
               Create admin-only forms after
               successful admin login.
            */

            if (CBRA_IS_ADMIN) {

                createSourceManagementForm();
                createDocumentManagementForm();

            }


            setMessage(
                "login-message",
                CBRA_IS_ADMIN
                    ? "Logged in."
                    : "Logged in."
            );


            /*
               If a person was already selected,
               refresh the management interface.
            */

            if (currentPersonId) {

                await loadPerson(
                    currentPersonId
                );

            }

        }
    );

}


/* =========================================
   LOGOUT
   ========================================= */

function setupLogoutButton() {

    const button =
        document.getElementById(
            "logout-button"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        async () => {

            await supabaseClient.auth.signOut();


            CBRA_IS_ADMIN =
                false;


            currentPersonId =
                null;


            updateCurrentPersonId();


            window.location.reload();

        }
    );

}


/* =========================================
   HELPERS
   ========================================= */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) return "";


    return element.value.trim();

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.value =
        value ?? "";

}


function setMessage(
    id,
    message
) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.textContent =
        message;

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* =========================================
   PUBLIC PERSON LINK
   ========================================= */

function getPersonPublicUrl(
    personId
) {

    return (
        "person.html?id=" +
        encodeURIComponent(
            personId
        )
    );

}


/* =========================================
   EXPORTS
   ========================================= */

window.supabaseClient =
    supabaseClient;


window.loadPerson =
    loadPerson;


window.loadPersonCases =
    loadPersonCases;


window.loadPersonSources =
    loadPersonSources;


window.loadPersonMugshots =
    loadPersonMugshots;


window.loadPersonDocuments =
    loadPersonDocuments;


window.removePersonSourceConnection =
    removePersonSourceConnection;


window.addPersonSource =
    addPersonSource;


window.assignExistingSourceToPerson =
    assignExistingSourceToPerson;


window.addPersonDocument =
    addPersonDocument;


window.getPersonPublicUrl =
    getPersonPublicUrl;


/*
   Use a getter so window.currentPersonId
   always reflects the actual current ID.
*/

Object.defineProperty(
    window,
    "currentPersonId",
    {
        configurable: true,

        get() {
            return currentPersonId;
        }

    }
);