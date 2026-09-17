/* =========================================
   CBRA — PERSON MANAGEMENT
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


/* -----------------------------------------
   STATE
   ----------------------------------------- */

let currentPersonId = null;


/* =========================================
   INITIALIZE
   ========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await checkAdmin();

        await loadPeopleSelector();

        createSourceManagementForm();

        createDocumentManagementForm();

        setupPersonSelector();

        setupPersonForm();

        setupLoginForm();

        setupLogoutButton();

        setupMugshotForm();

    }
);


/* =========================================
   ADMIN CHECK
   ========================================= */

async function checkAdmin() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {

        console.error(
            "Not logged in."
        );

        return false;
    }

    if (user.id !== CBRA_ADMIN_USER_ID) {

        console.error(
            "Not authorized."
        );

        return false;
    }

    console.log(
        "CBRA admin authenticated."
    );

    return true;
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
                document.getElementById(
                    "login-email"
                )?.value
                    .trim();

            const password =
                document.getElementById(
                    "login-password"
                )?.value;

            const message =
                document.getElementById(
                    "login-message"
                );

            if (message) {
                message.textContent =
                    "Logging in...";
            }

            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                if (message) {
                    message.textContent =
                        "Login failed.";
                }

                return;
            }

            if (
                !data ||
                !data.user
            ) {

                if (message) {
                    message.textContent =
                        "Login failed.";
                }

                return;
            }

            if (
                data.user.id !==
                CBRA_ADMIN_USER_ID
            ) {

                await supabaseClient.auth.signOut();

                if (message) {
                    message.textContent =
                        "This account is not authorized.";
                }

                return;
            }

            if (message) {
                message.textContent =
                    "Logged in.";
            }

            showManagementSection();

            await loadPeopleSelector();

        }
    );
}


/* =========================================
   SHOW MANAGEMENT
   ========================================= */

function showManagementSection() {

    const loginSection =
        document.getElementById(
            "login-section"
        );

    const managementSection =
        document.getElementById(
            "management-section"
        );

    if (loginSection) {
        loginSection.style.display =
            "none";
    }

    if (managementSection) {
        managementSection.style.display =
            "";
    }

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

            currentPersonId = null;

            const managementSection =
                document.getElementById(
                    "management-section"
                );

            const loginSection =
                document.getElementById(
                    "login-section"
                );

            if (managementSection) {
                managementSection.style.display =
                    "none";
            }

            if (loginSection) {
                loginSection.style.display =
                    "";
            }

        }
    );

}


/* =========================================
   LOAD PEOPLE SELECTOR
   ========================================= */

async function loadPeopleSelector(
    selectPersonId = null
) {

    const selector =
        document.getElementById(
            "person-selector"
        );

    if (!selector) {

        console.error(
            "Could not find #person-selector."
        );

        return;
    }

    selector.innerHTML =
        `<option value="">
            Loading people...
        </option>`;

    const {
        data,
        error
    } =
        await supabaseClient
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

        selector.innerHTML =
            `<option value="">
                Failed to load people
            </option>`;

        return;
    }

    selector.innerHTML =
        `<option value="">
            Select a person...
        </option>`;

    if (!data || data.length === 0) {

        console.log(
            "No people found in people table."
        );

        return;
    }

    data.forEach(
        person => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(
                    person.id
                );

            option.textContent =
                person.display_name ||
                "Unnamed Person";

            selector.appendChild(
                option
            );

        }
    );


    if (selectPersonId !== null) {

        const wantedId =
            String(
                selectPersonId
            );

        const matchingOption =
            Array.from(
                selector.options
            ).find(
                option =>
                    option.value === wantedId
            );

        if (matchingOption) {

            selector.value =
                wantedId;

            currentPersonId =
                Number(
                    wantedId
                );

            await loadPerson(
                currentPersonId
            );

            await loadPersonCases(
                currentPersonId
            );

            await loadPersonSources(
                currentPersonId
            );

            await loadPersonMugshots(
                currentPersonId
            );

            await loadPersonDocuments(
                currentPersonId
            );

            await updatePublicPersonLink(
                currentPersonId
            );

        } else {

            console.warn(
                "Person was created but could not be selected:",
                wantedId
            );

        }

    }

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
        async () => {

            const personId =
                selector.value;

            if (!personId) {

                currentPersonId =
                    null;

                clearPersonManagement();

                return;
            }

            currentPersonId =
                Number(
                    personId
                );

            await loadPerson(
                currentPersonId
            );

            await loadPersonCases(
                currentPersonId
            );

            await loadPersonSources(
                currentPersonId
            );

            await loadPersonMugshots(
                currentPersonId
            );

            await loadPersonDocuments(
                currentPersonId
            );

            await updatePublicPersonLink(
                currentPersonId
            );

        }
    );

}


/* =========================================
   PERSON FORM
   ========================================= */

function setupPersonForm() {

    const form =
        document.getElementById(
            "person-form"
        );

    if (form) {

        form.addEventListener(
            "submit",
            updatePerson
        );

    }


    const clearButton =
        document.getElementById(
            "clear-person-button"
        );

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearPersonForm
        );

    }


    const newPersonButton =
        document.getElementById(
            "new-person-button"
        );

    if (newPersonButton) {

        newPersonButton.addEventListener(
            "click",
            startNewPerson
        );

    }

}


/* =========================================
   START NEW PERSON
   ========================================= */

function startNewPerson() {

    currentPersonId =
        null;

    const form =
        document.getElementById(
            "person-form"
        );

    if (form) {
        form.reset();
    }

    setValue(
        "person-id",
        ""
    );

    const selector =
        document.getElementById(
            "person-selector"
        );

    if (selector) {
        selector.value =
            "";
    }

    setMessage(
        "person-save-message",
        "Enter the new person's information, then click Save Person."
    );

    const nameInput =
        document.getElementById(
            "person-name-input"
        );

    if (nameInput) {
        nameInput.focus();
    }

}


/* =========================================
   LOAD PERSON
   ========================================= */

async function loadPerson(
    personId
) {

    const {
        data,
        error
    } =
        await supabaseClient
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

    setValue(
        "person-id",
        data.id
    );

    setValue(
        "person-name-input",
        data.display_name || ""
    );

    setValue(
        "person-age-input",
        data.age_at_case ?? ""
    );

    setValue(
        "person-gender-input",
        data.gender || ""
    );

    setValue(
        "person-dob-input",
        data.date_of_birth || ""
    );

}


/* =========================================
   CREATE / UPDATE PERSON
   ========================================= */

async function updatePerson(
    event
) {

    event.preventDefault();

    const name =
        getValue(
            "person-name-input"
        );

    const age =
        getValue(
            "person-age-input"
        );

    const gender =
        getValue(
            "person-gender-input"
        );

    const dob =
        getValue(
            "person-dob-input"
        );


    if (!name) {

        setMessage(
            "person-save-message",
            "Name is required."
        );

        return;
    }


    if (!currentPersonId) {

        setMessage(
            "person-save-message",
            "Creating person..."
        );

        const {
            data: newPerson,
            error
        } =
            await supabaseClient
                .from("people")
                .insert({
                    display_name:
                        name,

                    age_at_case:
                        age
                            ? Number(age)
                            : null,

                    gender:
                        gender || null,

                    date_of_birth:
                        dob || null
                })
                .select()
                .single();


        if (error) {

            console.error(
                "PERSON INSERT FAILED:",
                error
            );

            setMessage(
                "person-save-message",
                `Failed to create person: ${error.message}`
            );

            return;
        }


        currentPersonId =
            Number(
                newPerson.id
            );


        setValue(
            "person-id",
            currentPersonId
        );


        await loadPeopleSelector(
            currentPersonId
        );

        await loadPersonCases(
            currentPersonId
        );

        await loadPersonSources(
            currentPersonId
        );

        await loadPersonMugshots(
            currentPersonId
        );

        await loadPersonDocuments(
            currentPersonId
        );

        await updatePublicPersonLink(
            currentPersonId
        );


        setMessage(
            "person-save-message",
            "Person created successfully."
        );

        return;
    }


    setMessage(
        "person-save-message",
        "Saving changes..."
    );


    const {
        error
    } =
        await supabaseClient
            .from("people")
            .update({
                display_name:
                    name,

                age_at_case:
                    age
                        ? Number(age)
                        : null,

                gender:
                    gender || null,

                date_of_birth:
                    dob || null
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
            "person-save-message",
            `Failed to update person: ${error.message}`
        );

        return;
    }


    setMessage(
        "person-save-message",
        "Person updated successfully."
    );


    await loadPeopleSelector(
        currentPersonId
    );

}


/* =========================================
   CLEAR PERSON
   ========================================= */

function clearPersonForm() {

    currentPersonId =
        null;

    const form =
        document.getElementById(
            "person-form"
        );

    if (form) {
        form.reset();
    }

    const selector =
        document.getElementById(
            "person-selector"
        );

    if (selector) {
        selector.value =
            "";
    }

    setValue(
        "person-id",
        ""
    );

    clearPersonManagement();

}


/* =========================================
   CLEAR MANAGEMENT AREAS
   ========================================= */

function clearPersonManagement() {

    const cases =
        document.getElementById(
            "person-cases-management"
        );

    const mugshots =
        document.getElementById(
            "person-mugshots-management"
        );

    const documents =
        document.getElementById(
            "person-documents-management"
        );

    const sources =
        document.getElementById(
            "person-sources-management"
        );


    if (cases) {

        cases.innerHTML =
            "<p>Select a person to view their cases.</p>";

    }


    if (mugshots) {

        mugshots.innerHTML =
            "<p>Select a person to view mugshots.</p>";

    }


    if (documents) {

        documents.innerHTML =
            "<p>No person documents available.</p>";

    }


    if (sources) {

        sources.innerHTML =
            "<p>Person-specific sources will appear here.</p>";

    }

}


/* =========================================
   LOAD PERSON CASES
   ========================================= */

async function loadPersonCases(
    personId
) {

    const container =
        document.getElementById(
            "person-cases-management"
        );

    if (!container) return;

    container.innerHTML =
        "Loading cases...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_people")
            .select(`
                id,
                role,
                cases (
                    id,
                    name,
                    case_date,
                    city,
                    state,
                    offense,
                    classification,
                    status
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
            "Failed to load cases.";

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            "<p>No cases connected to this person.</p>";

        return;
    }


    container.innerHTML =
        "";


    data.forEach(
        connection => {

            const caseData =
                connection.cases;

            if (!caseData) return;


            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "person-case";


            div.innerHTML = `
                <strong>
                    ${escapeHTML(
                        caseData.name || ""
                    )}
                </strong>

                <div>
                    ${escapeHTML(
                        connection.role || ""
                    )}
                </div>

                <div>
                    ${escapeHTML(
                        caseData.city || ""
                    )}

                    ${
                        caseData.state
                            ? ", " +
                              escapeHTML(
                                  caseData.state
                              )
                            : ""
                    }
                </div>

                <div>
                    ${escapeHTML(
                        caseData.offense || ""
                    )}
                </div>
            `;


            container.appendChild(
                div
            );

        }
    );

}


/* =========================================
   SOURCES
   ========================================= */


/* -----------------------------------------
   CANONICAL SOURCE TYPES
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


/* -----------------------------------------
   CREATE SOURCE MANAGEMENT FORM
   ----------------------------------------- */

function createSourceManagementForm() {

    const container =
        document.getElementById(
            "person-sources-management"
        );

    if (!container) return;


    const existingForm =
        document.getElementById(
            "person-source-form"
        );

    if (existingForm) return;


    const form =
        document.createElement(
            "form"
        );

    form.id =
        "person-source-form";


    form.innerHTML = `

        <h3>Sources</h3>

        <div class="person-source-assignment">

            <h4>
                Assign Existing Source
            </h4>

            <select
                id="person-existing-source"
            >

                <option value="">
                    Select an existing source...
                </option>

            </select>

            <button
                type="button"
                id="assign-person-source-button"
            >
                Assign Source
            </button>

        </div>


        <hr>


        <div class="person-source-create">

            <h4>
                Create New Source
            </h4>

            <label>
                Case
            </label>

            <select
                id="person-source-case"
                required
            >

                <option value="">
                    Select case...
                </option>

            </select>


            <label>
                Source Title
            </label>

            <input
                type="text"
                id="person-source-title"
                placeholder="Source title"
                required
            >


            <label>
                Source Type
            </label>

            <select
                id="person-source-type"
                required
            >

                <option value="">
                    Select source type...
                </option>

                ${PERSON_SOURCE_TYPES.map(
                    type =>
                        `
                        <option value="${escapeAttribute(
                            type
                        )}">
                            ${escapeHTML(
                                type
                            )}
                        </option>
                        `
                ).join("")}

            </select>


            <label>
                Publication Date
            </label>

            <input
                type="date"
                id="person-source-date"
            >


            <label>
                Source URL
            </label>

            <input
                type="url"
                id="person-source-url"
                placeholder="https://..."
                required
            >


            <button
                type="submit"
            >
                Create & Add Source
            </button>

        </div>


        <div
            id="person-source-message"
        ></div>

    `;


    container.prepend(
        form
    );


    form.addEventListener(
        "submit",
        addPersonSource
    );


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

}


/* -----------------------------------------
   LOAD CASES FOR SOURCE CREATION
   ----------------------------------------- */

async function loadPersonSourceCases(
    personId
) {

    const selector =
        document.getElementById(
            "person-source-case"
        );

    if (!selector) return;


    selector.innerHTML =
        `
        <option value="">
            Loading cases...
        </option>
        `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_people")
            .select(`
                case_id,
                role,
                cases (
                    id,
                    name,
                    case_date,
                    city,
                    state
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

        selector.innerHTML =
            `
            <option value="">
                Failed to load cases
            </option>
            `;

        return;
    }


    selector.innerHTML =
        `
        <option value="">
            Select case...
        </option>
        `;


    const seen =
        new Set();


    (data || []).forEach(
        connection => {

            const caseData =
                connection.cases;

            if (!caseData) return;


            const caseId =
                connection.case_id ||
                caseData.id;


            if (
                caseId === null ||
                caseId === undefined
            ) {
                return;
            }


            const key =
                String(
                    caseId
                );


            if (
                seen.has(key)
            ) {
                return;
            }


            seen.add(key);


            const option =
                document.createElement(
                    "option"
                );

            option.value =
                key;


            let label =
                caseData.name ||
                `Case ${key}`;


            if (caseData.case_date) {

                label +=
                    ` — ${caseData.case_date}`;

            }


            if (caseData.city) {

                label +=
                    ` — ${caseData.city}`;

            }


            option.textContent =
                label;


            selector.appendChild(
                option
            );

        }
    );


    if (
        selector.options.length === 1
    ) {

        selector.innerHTML =
            `
            <option value="">
                This person is not connected to any cases.
            </option>
            `;

    }

}


/* -----------------------------------------
   LOAD EXISTING CASE SOURCES
   ----------------------------------------- */

async function loadExistingSourcesForPerson(
    personId
) {

    const selector =
        document.getElementById(
            "person-existing-source"
        );

    if (!selector) return;


    selector.innerHTML =
        `
        <option value="">
            Loading sources...
        </option>
        `;


    /* -----------------------------------------
       GET PERSON'S CASES
       ----------------------------------------- */

    const {
        data: caseConnections,
        error: caseError
    } =
        await supabaseClient
            .from("case_people")
            .select(
                "case_id"
            )
            .eq(
                "person_id",
                personId
            );


    if (caseError) {

        console.error(
            "Error loading person's cases for sources:",
            caseError
        );

        selector.innerHTML =
            `
            <option value="">
                Failed to load sources
            </option>
            `;

        return;
    }


    const caseIds =
        (caseConnections || [])
            .map(
                row =>
                    row.case_id
            )
            .filter(
                id =>
                    id !== null &&
                    id !== undefined
            );


    if (
        caseIds.length === 0
    ) {

        selector.innerHTML =
            `
            <option value="">
                No case sources available
            </option>
            `;

        return;
    }


    /* -----------------------------------------
       GET SOURCES FOR THOSE CASES
       ----------------------------------------- */

    const {
        data: sources,
        error: sourceError
    } =
        await supabaseClient
            .from("sources")
            .select(`
                id,
                title,
                url,
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

        selector.innerHTML =
            `
            <option value="">
                Failed to load sources
            </option>
            `;

        return;
    }


    /* -----------------------------------------
       GET SOURCES ALREADY LINKED TO PERSON
       ----------------------------------------- */

    const {
        data: existingConnections,
        error: existingError
    } =
        await supabaseClient
            .from("source_people")
            .select(
                "source_id"
            )
            .eq(
                "person_id",
                personId
            );


    if (existingError) {

        console.error(
            "Error loading existing person source connections:",
            existingError
        );

        selector.innerHTML =
            `
            <option value="">
                Failed to load sources
            </option>
            `;

        return;
    }


    const alreadyLinked =
        new Set(
            (existingConnections || [])
                .map(
                    row =>
                        String(
                            row.source_id
                        )
                )
        );


    selector.innerHTML =
        `
        <option value="">
            Select an existing source...
        </option>
        `;


    (sources || []).forEach(
        source => {

            if (
                alreadyLinked.has(
                    String(
                        source.id
                    )
                )
            ) {
                return;
            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    source.id
                );


            let label =
                source.title ||
                "Untitled Source";


            if (
                source.source_type
            ) {

                label +=
                    ` — ${source.source_type}`;

            }


            if (
                source.publication_date
            ) {

                label +=
                    ` — ${source.publication_date}`;

            }


            option.textContent =
                label;


            selector.appendChild(
                option
            );

        }
    );


    if (
        selector.options.length === 1
    ) {

        selector.innerHTML =
            `
            <option value="">
                No unassigned case sources available
            </option>
            `;

    }

}


/* -----------------------------------------
   LOAD PERSON SOURCES
   ----------------------------------------- */

async function loadPersonSources(
    personId
) {

    const container =
        document.getElementById(
            "person-sources-management"
        );

    if (!container) return;


    /*
       clearPersonManagement() can remove
       the dynamically-created form.

       Recreate it when necessary.
    */

    if (
        !document.getElementById(
            "person-source-form"
        )
    ) {

        container.innerHTML =
            "";

        createSourceManagementForm();

    }


    const form =
        document.getElementById(
            "person-source-form"
        );


    container.innerHTML =
        "";


    if (form) {

        container.appendChild(
            form
        );

    }


    const list =
        document.createElement(
            "div"
        );

    list.id =
        "person-sources-list";

    list.innerHTML =
        "Loading sources...";


    container.appendChild(
        list
    );


    await loadPersonSourceCases(
        personId
    );

    await loadExistingSourcesForPerson(
        personId
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("source_people")
            .select(`
                id,
                source_id,
                source:sources (
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
            "Failed to load sources.";

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        list.innerHTML =
            "<p>No sources connected to this person.</p>";

        return;
    }


    list.innerHTML =
        "";


    data.forEach(
        connection => {

            const source =
                connection.source;

            if (!source) return;


            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "person-source";


            div.innerHTML = `

                <div class="source-title">

                    <strong>
                        ${escapeHTML(
                            source.title ||
                            "Untitled Source"
                        )}
                    </strong>

                </div>


                <div class="source-type">

                    ${escapeHTML(
                        source.source_type ||
                        "Other"
                    )}

                </div>


                ${
                    source.publication_date
                        ? `
                            <div class="source-date">
                                Published:
                                ${escapeHTML(
                                    source.publication_date
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    source.case_id !== null &&
                    source.case_id !== undefined
                        ? `
                            <div class="source-case">
                                Case ID:
                                ${escapeHTML(
                                    source.case_id
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    source.url
                        ? `
                            <div class="source-url">

                                <a
                                    href="${escapeAttribute(
                                        source.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open Source
                                </a>

                            </div>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="remove-source-btn"
                >
                    Remove From Person
                </button>

            `;


            const button =
                div.querySelector(
                    ".remove-source-btn"
                );


            if (button) {

                button.addEventListener(
                    "click",
                    () =>
                        removePersonSourceConnection(
                            connection.id,
                            personId
                        )
                );

            }


            list.appendChild(
                div
            );

        }
    );

}


/* -----------------------------------------
   ASSIGN EXISTING SOURCE
   ----------------------------------------- */

async function assignExistingSourceToPerson() {

    if (!currentPersonId) {

        alert(
            "Select a person first."
        );

        return;
    }


    const selector =
        document.getElementById(
            "person-existing-source"
        );


    if (!selector) return;


    const sourceId =
        selector.value;


    const message =
        document.getElementById(
            "person-source-message"
        );


    if (!sourceId) {

        if (message) {

            message.textContent =
                "Select a source first.";

        }

        return;
    }


    if (message) {

        message.textContent =
            "Assigning source...";

    }


    /* -----------------------------------------
       PREVENT DUPLICATES
       ----------------------------------------- */

    const {
        data: existing,
        error: existingError
    } =
        await supabaseClient
            .from("source_people")
            .select(
                "id"
            )
            .eq(
                "source_id",
                Number(sourceId)
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

        if (message) {

            message.textContent =
                `Failed to check source: ${existingError.message}`;

        }

        return;
    }


    if (existing) {

        if (message) {

            message.textContent =
                "This source is already assigned to this person.";

        }

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("source_people")
            .insert({
                source_id:
                    Number(sourceId),

                person_id:
                    currentPersonId
            });


    if (error) {

        console.error(
            "Error assigning existing source:",
            error
        );

        if (message) {

            message.textContent =
                `Failed to assign source: ${error.message}`;

        }

        return;
    }


    if (message) {

        message.textContent =
            "Source assigned successfully.";

    }


    selector.value =
        "";


    await loadPersonSources(
        currentPersonId
    );

}


/* -----------------------------------------
   CREATE NEW PERSON SOURCE
   ----------------------------------------- */

async function addPersonSource(
    event
) {

    event.preventDefault();


    if (!currentPersonId) {

        alert(
            "Select a person first."
        );

        return;
    }


    const caseId =
        getValue(
            "person-source-case"
        );


    const title =
        getValue(
            "person-source-title"
        );


    const type =
        getValue(
            "person-source-type"
        );


    const date =
        getValue(
            "person-source-date"
        );


    const url =
        getValue(
            "person-source-url"
        );


    const message =
        document.getElementById(
            "person-source-message"
        );


    if (!caseId) {

        if (message) {

            message.textContent =
                "Select a case for this source.";

        }

        return;
    }


    if (!title || !url) {

        if (message) {

            message.textContent =
                "Title and URL are required.";

        }

        return;
    }


    if (!type) {

        if (message) {

            message.textContent =
                "Select a source type.";

        }

        return;
    }


    if (message) {

        message.textContent =
            "Creating source...";

    }


    /* -----------------------------------------
       CREATE SOURCE
       ----------------------------------------- */

    const {
        data: source,
        error: sourceError
    } =
        await supabaseClient
            .from("sources")
            .insert({
                title,

                url,

                source_type:
                    type,

                publication_date:
                    date || null,

                case_id:
                    Number(
                        caseId
                    )
            })
            .select()
            .single();


    if (sourceError) {

        console.error(
            "Error creating source:",
            sourceError
        );

        if (message) {

            message.textContent =
                `Failed to create source: ${sourceError.message}`;

        }

        return;
    }


    /* -----------------------------------------
       CONNECT SOURCE TO PERSON
       ----------------------------------------- */

    const {
        error: connectionError
    } =
        await supabaseClient
            .from("source_people")
            .insert({
                source_id:
                    source.id,

                person_id:
                    currentPersonId
            });


    if (connectionError) {

        console.error(
            "Error connecting source to person:",
            connectionError
        );


        /*
           Roll back the source so we don't
           leave an orphaned source.
        */

        await supabaseClient
            .from("sources")
            .delete()
            .eq(
                "id",
                source.id
            );


        if (message) {

            message.textContent =
                `Source was created but could not be connected: ${connectionError.message}`;

        }

        return;
    }


    if (message) {

        message.textContent =
            "Source created and added successfully.";

    }


    const form =
        document.getElementById(
            "person-source-form"
        );


    if (form) {

        /*
           Reset only the new-source fields.
           The dynamic selectors remain available.
        */

        const titleInput =
            document.getElementById(
                "person-source-title"
            );

        const typeInput =
            document.getElementById(
                "person-source-type"
            );

        const dateInput =
            document.getElementById(
                "person-source-date"
            );

        const urlInput =
            document.getElementById(
                "person-source-url"
            );

        if (titleInput) {
            titleInput.value = "";
        }

        if (typeInput) {
            typeInput.value = "";
        }

        if (dateInput) {
            dateInput.value = "";
        }

        if (urlInput) {
            urlInput.value = "";
        }

    }


    await loadPersonSources(
        currentPersonId
    );


    /*
       If Manage Cases is currently using
       this same case, refresh its source list.
    */

    if (
        typeof window.loadManageSources ===
        "function"
    ) {

        await window.loadManageSources(
            Number(
                caseId
            )
        );

    }


    if (
        typeof window.loadCrimeScenePhotoSources ===
        "function"
    ) {

        await window.loadCrimeScenePhotoSources(
            Number(
                caseId
            )
        );

    }


    if (
        typeof window.loadGeneralMediaSources ===
        "function"
    ) {

        await window.loadGeneralMediaSources(
            Number(
                caseId
            )
        );

    }

}


/* -----------------------------------------
   REMOVE SOURCE FROM PERSON
   ----------------------------------------- */

async function removePersonSourceConnection(
    connectionId,
    personId
) {

    if (
        !confirm(
            "Remove this source from this person?"
        )
    ) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("source_people")
            .delete()
            .eq(
                "id",
                connectionId
            );


    if (error) {

        console.error(
            "Error removing source:",
            error
        );

        alert(
            `Failed to remove source: ${error.message}`
        );

        return;
    }


    await loadPersonSources(
        personId
    );

}


/* =========================================
   MUGSHOTS
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
        "Loading mugshots...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("person_mugshots")
            .select(`
                id,
                person_id,
                title,
                image_url,
                date_taken,
                description,
                source_id
            `)
            .eq(
                "person_id",
                personId
            )
            .order(
                "date_taken",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );


    if (error) {

        console.error(
            "Error loading mugshots:",
            error
        );

        container.innerHTML =
            "Failed to load mugshots.";

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            "<p>No mugshots have been added for this person.</p>";

        return;
    }


    container.innerHTML =
        "";


    for (const mugshot of data) {

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "person-mugshot";

        div.dataset.mugshotId =
            mugshot.id;


        div.innerHTML = `
            ${
                mugshot.image_url
                    ? `
                        <div>
                            <img
                                src="${escapeAttribute(
                                    mugshot.image_url
                                )}"
                                alt="${escapeAttribute(
                                    mugshot.title ||
                                    "Mugshot"
                                )}"
                                style="
                                    max-width: 250px;
                                    max-height: 350px;
                                    object-fit: contain;
                                "
                            >
                        </div>
                    `
                    : `
                        <p>
                            No image available.
                        </p>
                    `
            }

            <div>
                <strong>
                    ${escapeHTML(
                        mugshot.title ||
                        "Untitled Mugshot"
                    )}
                </strong>
            </div>

            ${
                mugshot.date_taken
                    ? `
                        <div>
                            Date:
                            ${escapeHTML(
                                mugshot.date_taken
                            )}
                        </div>
                    `
                    : ""
            }

            ${
                mugshot.description
                    ? `
                        <div>
                            ${escapeHTML(
                                mugshot.description
                            )}
                        </div>
                    `
                    : ""
            }

            <div style="margin-top: 10px;">

                <button
                    type="button"
                    class="edit-mugshot-btn"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-mugshot-btn"
                >
                    Delete
                </button>

            </div>
        `;


        const editButton =
            div.querySelector(
                ".edit-mugshot-btn"
            );

        const deleteButton =
            div.querySelector(
                ".delete-mugshot-btn"
            );


        editButton.addEventListener(
            "click",
            () => {

                showMugshotEditForm(
                    mugshot,
                    div
                );

            }
        );


        deleteButton.addEventListener(
            "click",
            () => {

                deletePersonMugshot(
                    mugshot.id,
                    mugshot.person_id,
                    mugshot.image_url
                );

            }
        );


        container.appendChild(
            div
        );

    }

}


/* =========================================
   MUGSHOT EDIT FORM
   ========================================= */

async function showMugshotEditForm(
    mugshot,
    container
) {

    const sources =
        await getPersonSourcesForDropdown(
            mugshot.person_id
        );


    container.innerHTML = `

        <form class="mugshot-edit-form">

            <h3>Edit Mugshot</h3>

            ${
                mugshot.image_url
                    ? `
                        <div style="margin-bottom: 15px;">

                            <p>
                                <strong>
                                    Current Image
                                </strong>
                            </p>

                            <img
                                src="${escapeAttribute(
                                    mugshot.image_url
                                )}"
                                alt="${escapeAttribute(
                                    mugshot.title ||
                                    "Current mugshot"
                                )}"
                                style="
                                    max-width: 250px;
                                    max-height: 350px;
                                    object-fit: contain;
                                    display: block;
                                "
                            >

                        </div>
                    `
                    : ""
            }

            <label>
                Replacement Image
            </label>

            <input
                type="file"
                class="edit-mugshot-image"
                accept="image/*"
            >

            <small>
                Leave this empty to keep the current image.
            </small>

            <label>
                Title
            </label>

            <input
                type="text"
                class="edit-mugshot-title"
                value="${escapeAttribute(
                    mugshot.title || ""
                )}"
                placeholder="Example: Booking photograph"
            >

            <label>
                Date Taken
            </label>

            <input
                type="date"
                class="edit-mugshot-date"
                value="${escapeAttribute(
                    mugshot.date_taken || ""
                )}"
            >

            <label>
                Description
            </label>

            <textarea
                class="edit-mugshot-description"
                rows="4"
                placeholder="Optional description"
            >${escapeHTML(
                mugshot.description || ""
            )}</textarea>

            <label>
                Source
            </label>

            <select class="edit-mugshot-source">

                <option value="">
                    -- Select Source --
                </option>

                ${sources.map(
                    source => `
                        <option
                            value="${escapeAttribute(
                                source.id
                            )}"
                            ${
                                String(
                                    source.id
                                ) ===
                                String(
                                    mugshot.source_id
                                )
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escapeHTML(
                                source.title
                            )}
                        </option>
                    `
                ).join("")}

            </select>

            <div style="margin-top: 10px;">

                <button
                    type="submit"
                >
                    Save Changes
                </button>

                <button
                    type="button"
                    class="cancel-mugshot-edit"
                >
                    Cancel
                </button>

            </div>

            <div class="edit-mugshot-message"></div>

        </form>
    `;


    const form =
        container.querySelector(
            ".mugshot-edit-form"
        );

    const cancelButton =
        container.querySelector(
            ".cancel-mugshot-edit"
        );


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await editPersonMugshot(
                mugshot,
                form
            );

        }
    );


    cancelButton.addEventListener(
        "click",
        () => {

            loadPersonMugshots(
                currentPersonId
            );

        }
    );

}


/* =========================================
   EDIT PERSON MUGSHOT
   ========================================= */

async function editPersonMugshot(
    mugshot,
    form
) {

    const message =
        form.querySelector(
            ".edit-mugshot-message"
        );


    const title =
        form.querySelector(
            ".edit-mugshot-title"
        )?.value
            .trim();


    const date =
        form.querySelector(
            ".edit-mugshot-date"
        )?.value;


    const description =
        form.querySelector(
            ".edit-mugshot-description"
        )?.value
            .trim();


    const sourceId =
        form.querySelector(
            ".edit-mugshot-source"
        )?.value;


    const fileInput =
        form.querySelector(
            ".edit-mugshot-image"
        );


    const newFile =
        fileInput &&
        fileInput.files.length
            ? fileInput.files[0]
            : null;


    if (message) {

        message.textContent =
            "Saving changes...";

    }


    try {

        let newImageUrl =
            mugshot.image_url ||
            null;

        let newStoragePath =
            null;


        if (newFile) {

            const safeFileName =
                newFile.name
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9._-]/g,
                        "-"
                    );


            newStoragePath =
                `${mugshot.person_id}/${Date.now()}-${safeFileName}`;


            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from("mugshots")
                    .upload(
                        newStoragePath,
                        newFile,
                        {
                            upsert: false
                        }
                    );


            if (uploadError) {
                throw uploadError;
            }


            const {
                data: publicUrlData
            } =
                supabaseClient
                    .storage
                    .from("mugshots")
                    .getPublicUrl(
                        newStoragePath
                    );


            newImageUrl =
                publicUrlData.publicUrl;

        }


        const {
            error: updateError
        } =
            await supabaseClient
                .from("person_mugshots")
                .update({
                    title:
                        title || null,

                    image_url:
                        newImageUrl,

                    date_taken:
                        date || null,

                    description:
                        description || null,

                    source_id:
                        sourceId
                            ? Number(sourceId)
                            : null
                })
                .eq(
                    "id",
                    mugshot.id
                )
                .eq(
                    "person_id",
                    mugshot.person_id
                );


        if (updateError) {

            if (newStoragePath) {

                await supabaseClient
                    .storage
                    .from("mugshots")
                    .remove([
                        newStoragePath
                    ]);

            }

            throw updateError;
        }


        if (
            newFile &&
            mugshot.image_url
        ) {

            const oldStoragePath =
                getMugshotStoragePath(
                    mugshot.image_url
                );


            if (oldStoragePath) {

                const {
                    error:
                        storageDeleteError
                } =
                    await supabaseClient
                        .storage
                        .from("mugshots")
                        .remove([
                            oldStoragePath
                        ]);


                if (
                    storageDeleteError
                ) {

                    console.warn(
                        "New image saved, but old storage image could not be removed:",
                        storageDeleteError
                    );

                }

            }

        }


        if (message) {

            message.textContent =
                "Mugshot saved successfully.";

        }


        await loadPersonMugshots(
            currentPersonId
        );


    } catch (error) {

        console.error(
            "Error editing mugshot:",
            error
        );


        if (message) {

            message.textContent =
                `Failed to save mugshot: ${error.message}`;

        }

    }

}


/* =========================================
   DELETE PERSON MUGSHOT
   ========================================= */

async function deletePersonMugshot(
    mugshotId,
    personId,
    imageUrl
) {

    if (
        !confirm(
            "Delete this mugshot?"
        )
    ) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("person_mugshots")
                .delete()
                .eq(
                    "id",
                    mugshotId
                )
                .eq(
                    "person_id",
                    personId
                );


        if (error) {
            throw error;
        }


        if (imageUrl) {

            const storagePath =
                getMugshotStoragePath(
                    imageUrl
                );


            if (storagePath) {

                const {
                    error:
                        storageError
                } =
                    await supabaseClient
                        .storage
                        .from("mugshots")
                        .remove([
                            storagePath
                        ]);


                if (storageError) {

                    console.warn(
                        "Mugshot deleted from database, but storage file could not be removed:",
                        storageError
                    );

                }

            }

        }


        await loadPersonMugshots(
            personId
        );


    } catch (error) {

        console.error(
            "Error deleting mugshot:",
            error
        );

        alert(
            `Failed to delete mugshot: ${error.message}`
        );

    }

}


/* =========================================
   GET MUGSHOT STORAGE PATH
   ========================================= */

function getMugshotStoragePath(
    imageUrl
) {

    if (!imageUrl) {
        return null;
    }


    const marker =
        "/storage/v1/object/public/mugshots/";


    const index =
        imageUrl.indexOf(
            marker
        );


    if (index === -1) {
        return null;
    }


    return imageUrl.substring(
        index + marker.length
    );

}


/* =========================================
   GET PERSON SOURCES
   ========================================= */

async function getPersonSourcesForDropdown(
    personId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("source_people")
            .select(`
                source_id,
                source:sources (
                    id,
                    title
                )
            `)
            .eq(
                "person_id",
                personId
            );


    if (error) {

        console.error(
            "Error loading mugshot sources:",
            error
        );

        return [];
    }


    return (data || [])
        .filter(
            connection =>
                connection.source
        )
        .map(
            connection =>
                connection.source
        );

}


/* =========================================
   ADD MUGSHOT
   ========================================= */

function setupMugshotForm() {

    const form =
        document.getElementById(
            "mugshot-form"
        );

    if (!form) return;


    form.addEventListener(
        "submit",
        addPersonMugshot
    );

}


async function addPersonMugshot(
    event
) {

    event.preventDefault();


    if (!currentPersonId) {

        alert(
            "Select a person first."
        );

        return;
    }


    const title =
        getValue(
            "mugshot-title"
        );

    const date =
        getValue(
            "mugshot-date"
        );

    const description =
        getValue(
            "mugshot-description"
        );


    const fileInput =
        document.getElementById(
            "mugshot-image"
        );


    const message =
        document.getElementById(
            "mugshot-message"
        );


    if (
        !fileInput ||
        !fileInput.files.length
    ) {

        if (message) {

            message.textContent =
                "Please select an image.";

        }

        return;
    }


    const file =
        fileInput.files[0];


    if (message) {

        message.textContent =
            "Uploading mugshot...";

    }


    try {

        const safeFileName =
            file.name
                .toLowerCase()
                .replace(
                    /[^a-z0-9._-]/g,
                    "-"
                );


        const storagePath =
            `${currentPersonId}/${Date.now()}-${safeFileName}`;


        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("mugshots")
                .upload(
                    storagePath,
                    file,
                    {
                        upsert: false
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const {
            data: publicUrlData
        } =
            supabaseClient
                .storage
                .from("mugshots")
                .getPublicUrl(
                    storagePath
                );


        const imageUrl =
            publicUrlData.publicUrl;


        const {
            error: insertError
        } =
            await supabaseClient
                .from("person_mugshots")
                .insert({
                    person_id:
                        currentPersonId,

                    title:
                        title || null,

                    image_url:
                        imageUrl,

                    date_taken:
                        date || null,

                    description:
                        description || null,

                    source_id:
                        null
                });


        if (insertError) {

            await supabaseClient
                .storage
                .from("mugshots")
                .remove([
                    storagePath
                ]);

            throw insertError;
        }


        if (message) {

            message.textContent =
                "Mugshot added successfully.";

        }


        const form =
            document.getElementById(
                "mugshot-form"
            );


        if (form) {
            form.reset();
        }


        await loadPersonMugshots(
            currentPersonId
        );


    } catch (error) {

        console.error(
            "Error adding mugshot:",
            error
        );


        if (message) {

            message.textContent =
                `Unable to add mugshot: ${error.message}`;

        }

    }

}


/* =========================================
   DOCUMENTS
   ========================================= */

function createDocumentManagementForm() {

    const container =
        document.getElementById(
            "person-documents-management"
        );

    if (!container) return;


    const form =
        document.createElement(
            "form"
        );

    form.id =
        "person-document-form";


    form.innerHTML = `
        <h3>Add Document</h3>

        <input
            type="text"
            id="person-document-title"
            placeholder="Document title"
            required
        >

        <input
            type="text"
            id="person-document-type"
            placeholder="Document type"
        >

        <input
            type="date"
            id="person-document-date"
        >

        <input
            type="url"
            id="person-document-url"
            placeholder="Document URL"
            required
        >

        <textarea
            id="person-document-description"
            placeholder="Description"
        ></textarea>

        <button type="submit">
            Add Document
        </button>

        <div id="person-document-message"></div>
    `;


    container.prepend(
        form
    );


    form.addEventListener(
        "submit",
        addPersonDocument
    );

}


/* =========================================
   LOAD PERSON DOCUMENTS
   ========================================= */

async function loadPersonDocuments(
    personId
) {

    const container =
        document.getElementById(
            "person-documents-management"
        );

    if (!container) return;


    const form =
        document.getElementById(
            "person-document-form"
        );


    container.innerHTML =
        "";


    if (form) {

        container.appendChild(
            form
        );

    }


    const list =
        document.createElement(
            "div"
        );

    list.id =
        "person-documents-list";

    list.innerHTML =
        "Loading documents...";


    container.appendChild(
        list
    );


    const {
        data,
        error
    } =
        await supabaseClient
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
            "Error loading person documents:",
            error
        );

        list.innerHTML =
            "Failed to load documents.";

        return;
    }


    if (!data || data.length === 0) {

        list.innerHTML =
            "<p>No documents.</p>";

        return;
    }


    list.innerHTML =
        "";


    data.forEach(
        documentData => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "person-document";


            div.innerHTML = `
                <div class="person-document-display">

                    <strong>
                        ${escapeHTML(
                            documentData.title || ""
                        )}
                    </strong>

                    ${
                        documentData.document_type
                            ? `
                                <div>
                                    ${escapeHTML(
                                        documentData.document_type
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${
                        documentData.publication_date
                            ? `
                                <div>
                                    ${escapeHTML(
                                        documentData.publication_date
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${
                        documentData.description
                            ? `
                                <div>
                                    ${escapeHTML(
                                        documentData.description
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${
                        documentData.document_url
                            ? `
                                <div>
                                    <a
                                        href="${escapeAttribute(
                                            documentData.document_url
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open Document
                                    </a>
                                </div>
                            `
                            : ""
                    }

                    <div style="margin-top: 10px;">

                        <button
                            type="button"
                            class="edit-person-document-btn"
                        >
                            Edit
                        </button>

                    </div>

                </div>
            `;


            const editButton =
                div.querySelector(
                    ".edit-person-document-btn"
                );


            editButton.addEventListener(
                "click",
                () =>
                    showPersonDocumentEditForm(
                        documentData,
                        div
                    )
            );


            list.appendChild(
                div
            );

        }
    );

}


/* =========================================
   DOCUMENT EDIT
   ========================================= */

function showPersonDocumentEditForm(
    documentData,
    container
) {

    container.innerHTML = `

        <form class="person-document-edit-form">

            <h4>
                Edit Document
            </h4>

            <input
                type="text"
                class="edit-document-title"
                value="${escapeAttribute(
                    documentData.title || ""
                )}"
                placeholder="Document title"
                required
            >

            <input
                type="text"
                class="edit-document-type"
                value="${escapeAttribute(
                    documentData.document_type || ""
                )}"
                placeholder="Document type"
            >

            <input
                type="date"
                class="edit-document-date"
                value="${escapeAttribute(
                    documentData.publication_date || ""
                )}"
            >

            <input
                type="url"
                class="edit-document-url"
                value="${escapeAttribute(
                    documentData.document_url || ""
                )}"
                placeholder="Document URL"
                required
            >

            <textarea
                class="edit-document-description"
                placeholder="Description"
            >${escapeHTML(
                documentData.description || ""
            )}</textarea>

            <div style="margin-top: 10px;">

                <button type="submit">
                    Save Changes
                </button>

                <button
                    type="button"
                    class="cancel-document-edit"
                >
                    Cancel
                </button>

            </div>

            <div class="edit-document-message"></div>

        </form>
    `;


    const form =
        container.querySelector(
            ".person-document-edit-form"
        );

    const cancelButton =
        container.querySelector(
            ".cancel-document-edit"
        );


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await editPersonDocument(
                documentData.id,
                form
            );

        }
    );


    cancelButton.addEventListener(
        "click",
        () =>
            loadPersonDocuments(
                currentPersonId
            )
    );

}


/* =========================================
   EDIT PERSON DOCUMENT
   ========================================= */

async function editPersonDocument(
    documentId,
    form
) {

    const title =
        form.querySelector(
            ".edit-document-title"
        ).value.trim();


    const type =
        form.querySelector(
            ".edit-document-type"
        ).value.trim();


    const date =
        form.querySelector(
            ".edit-document-date"
        ).value;


    const url =
        form.querySelector(
            ".edit-document-url"
        ).value.trim();


    const description =
        form.querySelector(
            ".edit-document-description"
        ).value.trim();


    const message =
        form.querySelector(
            ".edit-document-message"
        );


    if (!title || !url) {

        message.textContent =
            "Title and URL are required.";

        return;
    }


    message.textContent =
        "Saving changes...";


    const {
        error
    } =
        await supabaseClient
            .from("person_documents")
            .update({
                title,

                document_type:
                    type || null,

                publication_date:
                    date || null,

                document_url:
                    url,

                description:
                    description || null
            })
            .eq(
                "id",
                documentId
            )
            .eq(
                "person_id",
                currentPersonId
            );


    if (error) {

        console.error(
            "Error updating person document:",
            error
        );

        message.textContent =
            `Failed to save changes: ${error.message}`;

        return;
    }


    await loadPersonDocuments(
        currentPersonId
    );

}


/* =========================================
   ADD DOCUMENT
   ========================================= */

async function addPersonDocument(
    event
) {

    event.preventDefault();


    if (!currentPersonId) {

        alert(
            "Select a person first."
        );

        return;
    }


    const title =
        getValue(
            "person-document-title"
        );

    const type =
        getValue(
            "person-document-type"
        );

    const date =
        getValue(
            "person-document-date"
        );

    const url =
        getValue(
            "person-document-url"
        );

    const description =
        getValue(
            "person-document-description"
        );


    const message =
        document.getElementById(
            "person-document-message"
        );


    if (!title || !url) {

        if (message) {

            message.textContent =
                "Title and URL are required.";

        }

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("person_documents")
            .insert({
                person_id:
                    currentPersonId,

                title,

                document_type:
                    type || null,

                publication_date:
                    date || null,

                document_url:
                    url,

                description:
                    description || null
            });


    if (error) {

        console.error(
            "Error adding person document:",
            error
        );

        if (message) {

            message.textContent =
                `Failed to add document: ${error.message}`;

        }

        return;
    }


    if (message) {

        message.textContent =
            "Document added.";

    }


    const form =
        document.getElementById(
            "person-document-form"
        );


    if (form) {
        form.reset();
    }


    await loadPersonDocuments(
        currentPersonId
    );

}


/* =========================================
   PUBLIC PERSON PROFILE
   ========================================= */

async function updatePublicPersonLink(
    personId
) {

    const link =
        document.getElementById(
            "public-person-link"
        );

    if (!link) return;


    link.href =
        `person.html?id=${encodeURIComponent(
            personId
        )}`;

}


/* =========================================
   GENERAL HELPERS
   ========================================= */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return "";
    }


    return element.value.trim();

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


function setMessage(
    id,
    message
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            message;

    }

}


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================
   ESCAPE ATTRIBUTE
   ========================================= */

function escapeAttribute(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}