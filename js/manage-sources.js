/* =========================================
   CBRA — MANAGE SOURCES
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const sourcesSupabase = window.supabaseClient;


/* -----------------------------------------
   SOURCE TYPES
   ----------------------------------------- */

const SOURCE_TYPES = [
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
   CURRENT CASE
   ----------------------------------------- */

function getSourceManagementCaseId() {

    if (
        typeof window.getCurrentCaseId === "function"
    ) {

        const id =
            window.getCurrentCaseId();

        if (id) {
            return Number(id);
        }
    }


    const selector =
        document.getElementById(
            "case-selector"
        );


    if (
        selector &&
        selector.value
    ) {

        return Number(
            selector.value
        );
    }


    return null;
}


/* -----------------------------------------
   HTML ESCAPE
   ----------------------------------------- */

function escapeSourceHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* -----------------------------------------
   NORMALIZE SOURCE TYPE
   -----------------------------------------

   Keeps source types consistent when
   displaying existing records.

   The database value itself is NOT changed.
   ----------------------------------------- */

function normalizeSourceType(value) {

    if (!value) {
        return "";
    }


    const original =
        String(value).trim();


    const exactMatch =
        SOURCE_TYPES.find(
            type =>
                type === original
        );


    if (exactMatch) {
        return exactMatch;
    }


    const caseInsensitiveMatch =
        SOURCE_TYPES.find(
            type =>
                type.toLowerCase() ===
                original.toLowerCase()
        );


    if (caseInsensitiveMatch) {
        return caseInsensitiveMatch;
    }


    return original;
}


/* -----------------------------------------
   GET PERSON DISPLAY NAME
   ----------------------------------------- */

function getPersonDisplayName(person) {

    if (!person) {
        return "Unnamed Person";
    }


    /* Existing display_name column */

    if (
        person.display_name &&
        String(person.display_name).trim()
    ) {

        return String(
            person.display_name
        ).trim();
    }


    /* Common first/last name combinations */

    const firstName =
        person.first_name ||
        person.firstname ||
        person.firstName ||
        "";


    const middleName =
        person.middle_name ||
        person.middlename ||
        person.middleName ||
        "";


    const lastName =
        person.last_name ||
        person.lastname ||
        person.lastName ||
        "";


    const fullName =
        [
            firstName,
            middleName,
            lastName
        ]
        .filter(Boolean)
        .join(" ")
        .trim();


    if (fullName) {
        return fullName;
    }


    /* Other possible name fields */

    if (
        person.full_name &&
        String(person.full_name).trim()
    ) {

        return String(
            person.full_name
        ).trim();
    }


    if (
        person.name &&
        String(person.name).trim()
    ) {

        return String(
            person.name
        ).trim();
    }


    return "Unnamed Person";
}


/* -----------------------------------------
   BUILD SOURCE MANAGEMENT UI
   ----------------------------------------- */

function buildSourcesManagementUI() {

    const container =
        document.getElementById(
            "sources-management"
        );


    if (!container) {

        console.error(
            "CBRA: #sources-management not found."
        );

        return;
    }


    container.innerHTML = `

        <div class="management-section">

            <h2>Sources</h2>


            <form id="sources-form">

                <input
                    type="hidden"
                    id="source-edit-id"
                    value=""
                >


                <div class="form-group">

                    <label for="source-title">
                        Source Title
                    </label>

                    <input
                        type="text"
                        id="source-title"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="source-type">
                        Source Type
                    </label>

                    <select
                        id="source-type"
                        required
                    >

                        <option value="">
                            Select source type
                        </option>

                        ${SOURCE_TYPES.map(
                            type => `
                                <option
                                    value="${escapeSourceHtml(type)}"
                                >
                                    ${escapeSourceHtml(type)}
                                </option>
                            `
                        ).join("")}

                    </select>

                </div>


                <div class="form-group">

                    <label for="source-date">
                        Publication Date
                    </label>

                    <input
                        type="date"
                        id="source-date"
                    >

                </div>


                <div class="form-group">

                    <label for="source-url">
                        URL
                    </label>

                    <input
                        type="url"
                        id="source-url"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="source-people">
                        Related People
                    </label>

                    <select
                        id="source-people"
                        multiple
                    ></select>

                    <small>
                        Hold Ctrl while clicking
                        to select multiple people.
                    </small>

                </div>


                <div class="form-actions">

                    <button
                        type="submit"
                        id="add-source"
                    >
                        Add Source
                    </button>


                    <button
                        type="button"
                        id="cancel-source-edit"
                        style="display:none;"
                    >
                        Cancel
                    </button>

                </div>


                <div
                    id="source-message"
                    class="management-message"
                ></div>

            </form>


            <div
                id="source-list"
                class="management-list"
            ></div>

        </div>
    `;


    /* Load people for currently selected case */

    loadSourcePeople();


    /* Load existing sources */

    const caseId =
        getSourceManagementCaseId();


    if (caseId) {

        loadManageSources(
            caseId
        );

    } else {

        loadManageSources();

    }
}


/* -----------------------------------------
   LOAD PEOPLE FOR CURRENT CASE
   ----------------------------------------- */

async function loadSourcePeople(
    caseId = null
) {

    const select =
        document.getElementById(
            "source-people"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option disabled>
            Loading people...
        </option>
    `;


    const numericCaseId =
        caseId
            ? Number(caseId)
            : getSourceManagementCaseId();


    if (!numericCaseId) {

        select.innerHTML = `
            <option disabled>
                Select a case first
            </option>
        `;

        return;
    }


    try {

        /* ---------------------------------
           GET PEOPLE LINKED TO CASE
           --------------------------------- */

        const {
            data: casePeople,
            error: casePeopleError
        } = await sourcesSupabase

            .from("case_people")

            .select("person_id")

            .eq(
                "case_id",
                numericCaseId
            );


        if (casePeopleError) {
            throw casePeopleError;
        }


        if (
            !casePeople ||
            casePeople.length === 0
        ) {

            select.innerHTML = `
                <option disabled>
                    No people linked to this case
                </option>
            `;

            return;
        }


        const personIds =
            casePeople
                .map(
                    row =>
                        row.person_id
                )
                .filter(
                    id =>
                        id !== null &&
                        id !== undefined
                );


        if (
            personIds.length === 0
        ) {

            select.innerHTML = `
                <option disabled>
                    No people linked to this case
                </option>
            `;

            return;
        }


        /* ---------------------------------
           GET PEOPLE
           --------------------------------- */

        const {
            data: people,
            error: peopleError
        } = await sourcesSupabase

            .from("people")

            .select("*")

            .in(
                "id",
                personIds
            );


        if (peopleError) {
            throw peopleError;
        }


        if (
            !people ||
            people.length === 0
        ) {

            select.innerHTML = `
                <option disabled>
                    No people found
                </option>
            `;

            return;
        }


        /* ---------------------------------
           SORT PEOPLE BY DISPLAY NAME
           --------------------------------- */

        people.sort(
            (a, b) =>
                getPersonDisplayName(a)
                    .localeCompare(
                        getPersonDisplayName(b)
                    )
        );


        /* ---------------------------------
           BUILD OPTIONS
           --------------------------------- */

        select.innerHTML = "";


        people.forEach(
            person => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(person.id);


                option.textContent =
                    getPersonDisplayName(
                        person
                    );


                select.appendChild(
                    option
                );
            }
        );


    } catch (error) {

        console.error(
            "CBRA: Failed to load source people:",
            error
        );


        select.innerHTML = `
            <option disabled>
                Error loading people
            </option>
        `;
    }
}


/* -----------------------------------------
   LOAD SOURCES FOR CURRENT CASE
   ----------------------------------------- */

async function loadManageSources(
    caseId = null
) {

    const list =
        document.getElementById(
            "source-list"
        );


    if (!list) {
        return;
    }


    const numericCaseId =
        caseId
            ? Number(caseId)
            : getSourceManagementCaseId();


    if (!numericCaseId) {

        list.innerHTML = `
            <p>Select a case to view sources.</p>
        `;

        return;
    }


    list.innerHTML = `
        <p>Loading sources...</p>
    `;


    try {

        /* ---------------------------------
           LOAD SOURCES
           --------------------------------- */

        const {
            data: sources,
            error
        } = await sourcesSupabase

            .from("sources")

            .select(`
                id,
                title,
                url,
                source_type,
                publication_date,
                case_id
            `)

            .eq(
                "case_id",
                numericCaseId
            )

            .order(
                "publication_date",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );


        if (error) {
            throw error;
        }


        if (
            !sources ||
            sources.length === 0
        ) {

            list.innerHTML = `
                <p>
                    No sources have been added
                    to this case.
                </p>
            `;

            return;
        }


        list.innerHTML = "";


        /* ---------------------------------
           BUILD SOURCE CARDS
           --------------------------------- */

        for (
            const source of sources
        ) {

            let peopleText = "";


            /* ---------------------------------
               LOAD PEOPLE LINKED TO SOURCE
               --------------------------------- */

            try {

                const {
                    data: sourcePeople,
                    error: sourcePeopleError
                } = await sourcesSupabase

                    .from("source_people")

                    .select("person_id")

                    .eq(
                        "source_id",
                        source.id
                    );


                if (
                    sourcePeopleError
                ) {

                    throw sourcePeopleError;
                }


                if (
                    sourcePeople &&
                    sourcePeople.length
                ) {

                    const personIds =
                        sourcePeople
                            .map(
                                row =>
                                    row.person_id
                            )
                            .filter(
                                id =>
                                    id !== null &&
                                    id !== undefined
                            );


                    if (
                        personIds.length
                    ) {

                        const {
                            data: people
                        } = await sourcesSupabase

                            .from("people")

                            .select("*")

                            .in(
                                "id",
                                personIds
                            );


                        if (
                            people &&
                            people.length
                        ) {

                            const peopleById =
                                new Map(
                                    people.map(
                                        person => [
                                            String(
                                                person.id
                                            ),
                                            getPersonDisplayName(
                                                person
                                            )
                                        ]
                                    )
                                );


                            peopleText =
                                personIds
                                    .map(
                                        id =>
                                            peopleById.get(
                                                String(id)
                                            )
                                    )
                                    .filter(Boolean)
                                    .join(", ");
                        }
                    }
                }

            } catch (peopleError) {

                console.warn(
                    "CBRA: Could not load source people:",
                    peopleError
                );
            }


            /* ---------------------------------
               CREATE CARD
               --------------------------------- */

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "management-card";


            const dateText =
                source.publication_date

                    ? new Date(
                        source.publication_date +
                        "T00:00:00"
                    ).toLocaleDateString()

                    : "No date";


            const displayedSourceType =
                normalizeSourceType(
                    source.source_type
                );


            card.innerHTML = `

                <div class="management-card-header">

                    <h3>
                        ${escapeSourceHtml(
                            source.title
                        )}
                    </h3>

                </div>


                <div class="management-card-body">

                    <p>
                        <strong>Type:</strong>
                        ${escapeSourceHtml(
                            displayedSourceType ||
                            "No type"
                        )}
                    </p>


                    <p>
                        <strong>Date:</strong>
                        ${escapeSourceHtml(
                            dateText
                        )}
                    </p>


                    ${
                        peopleText
                            ? `
                                <p>
                                    <strong>
                                        People:
                                    </strong>

                                    ${escapeSourceHtml(
                                        peopleText
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <p>
                        <a
                            href="${escapeSourceHtml(
                                source.url
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open Source
                        </a>
                    </p>

                </div>


                <div class="management-card-actions">

                    <button
                        type="button"
                        onclick="editSource(${source.id})"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        onclick="removeSource(${source.id})"
                    >
                        Remove
                    </button>

                </div>

            `;


            list.appendChild(
                card
            );
        }


    } catch (error) {

        console.error(
            "CBRA: Failed to load sources:",
            error
        );


        list.innerHTML = `
            <p class="error">
                Failed to load sources:
                ${escapeSourceHtml(
                    error.message
                )}
            </p>
        `;
    }
}


/* -----------------------------------------
   SAVE SOURCE
   ----------------------------------------- */

async function saveSource(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "source-message"
        );


    if (message) {

        message.textContent =
            "Saving source...";

    }


    const caseId =
        getSourceManagementCaseId();


    if (!caseId) {

        if (message) {

            message.textContent =
                "Select a case first.";

        }

        return;
    }


    const numericCurrentCaseId =
        Number(caseId);


    const title =
        document.getElementById(
            "source-title"
        )?.value.trim();


    const sourceTypeElement =
        document.getElementById(
            "source-type"
        );


    const sourceType =
        sourceTypeElement
            ?.value.trim();


    const publicationDate =
        document.getElementById(
            "source-date"
        )?.value || null;


    const url =
        document.getElementById(
            "source-url"
        )?.value.trim();


    const editId =
        document.getElementById(
            "source-edit-id"
        )?.value;


    const peopleSelect =
        document.getElementById(
            "source-people"
        );


    const selectedPeople =
        peopleSelect

            ? Array.from(
                peopleSelect.selectedOptions
            )
                .map(
                    option =>
                        Number(option.value)
                )
                .filter(
                    id =>
                        Number.isFinite(id)
                )

            : [];


    if (!title) {

        if (message) {

            message.textContent =
                "Source title is required.";

        }

        return;
    }


    if (!sourceType) {

        if (message) {

            message.textContent =
                "Select a source type.";

        }

        return;
    }


    if (!url) {

        if (message) {

            message.textContent =
                "Source URL is required.";

        }

        return;
    }


    try {

        let sourceId;


        /* ---------------------------------
           UPDATE EXISTING SOURCE
           --------------------------------- */

        if (editId) {

            const {
                data,
                error
            } = await sourcesSupabase

                .from("sources")

                .update({
                    title:
                        title,

                    source_type:
                        sourceType,

                    publication_date:
                        publicationDate,

                    url:
                        url,

                    case_id:
                        numericCurrentCaseId
                })

                .eq(
                    "id",
                    Number(editId)
                )

                .select()

                .single();


            if (error) {
                throw error;
            }


            sourceId =
                data.id;


        /* ---------------------------------
           CREATE NEW SOURCE
           --------------------------------- */

        } else {

            const {
                data,
                error
            } = await sourcesSupabase

                .from("sources")

                .insert({
                    title:
                        title,

                    source_type:
                        sourceType,

                    publication_date:
                        publicationDate,

                    url:
                        url,

                    case_id:
                        numericCurrentCaseId
                })

                .select()

                .single();


            if (error) {
                throw error;
            }


            sourceId =
                data.id;
        }


        /* ---------------------------------
           SOURCE PEOPLE
           --------------------------------- */

        const {
            error: peopleDeleteError
        } = await sourcesSupabase

            .from("source_people")

            .delete()

            .eq(
                "source_id",
                sourceId
            );


        if (peopleDeleteError) {
            throw peopleDeleteError;
        }


        if (
            selectedPeople.length > 0
        ) {

            const rows =
                selectedPeople.map(
                    personId => ({
                        source_id:
                            sourceId,

                        person_id:
                            personId
                    })
                );


            const {
                error:
                    peopleInsertError
            } = await sourcesSupabase

                .from("source_people")

                .insert(rows);


            if (peopleInsertError) {
                throw peopleInsertError;
            }
        }


        /* ---------------------------------
           RESET FORM
           --------------------------------- */

        resetSourceForm();


        if (message) {

            message.textContent =
                editId
                    ? "Source updated successfully."
                    : "Source added successfully.";

        }


        await loadSourcePeople(
            numericCurrentCaseId
        );


        await loadManageSources(
            numericCurrentCaseId
        );


    } catch (error) {

        console.error(
            "CBRA: Failed to save source:",
            error
        );


        if (message) {

            message.textContent =
                "Failed to save source: " +
                error.message;

        }
    }
}


/* -----------------------------------------
   EDIT SOURCE
   ----------------------------------------- */

async function editSource(
    sourceId
) {

    try {

        /* ---------------------------------
           LOAD SOURCE
           --------------------------------- */

        const {
            data: source,
            error
        } = await sourcesSupabase

            .from("sources")

            .select(`
                id,
                title,
                source_type,
                publication_date,
                url,
                case_id
            `)

            .eq(
                "id",
                Number(sourceId)
            )

            .single();


        if (error) {
            throw error;
        }


        /* ---------------------------------
           LOAD PEOPLE FIRST
           --------------------------------- */

        await loadSourcePeople(
            source.case_id
        );


        /* ---------------------------------
           FILL FORM
           --------------------------------- */

        const editId =
            document.getElementById(
                "source-edit-id"
            );


        const title =
            document.getElementById(
                "source-title"
            );


        const type =
            document.getElementById(
                "source-type"
            );


        const date =
            document.getElementById(
                "source-date"
            );


        const url =
            document.getElementById(
                "source-url"
            );


        if (editId) {

            editId.value =
                source.id;

        }


        if (title) {

            title.value =
                source.title || "";

        }


        if (type) {

            const storedType =
                String(
                    source.source_type || ""
                ).trim();


            const normalizedType =
                normalizeSourceType(
                    storedType
                );


            /*
             * If an old source type exists
             * that isn't one of the current
             * choices, temporarily add it
             * to the dropdown so editing does
             * not silently replace it.
             */

            const matchingOption =
                Array.from(
                    type.options
                ).find(
                    option =>
                        option.value ===
                        storedType
                );


            if (
                storedType &&
                !matchingOption
            ) {

                const legacyOption =
                    document.createElement(
                        "option"
                    );


                legacyOption.value =
                    storedType;


                legacyOption.textContent =
                    normalizedType;


                type.appendChild(
                    legacyOption
                );
            }


            type.value =
                storedType;

        }


        if (date) {

            date.value =
                source.publication_date || "";

        }


        if (url) {

            url.value =
                source.url || "";

        }


        /* ---------------------------------
           LOAD SOURCE PEOPLE
           --------------------------------- */

        const {
            data: sourcePeople,
            error: sourcePeopleError
        } = await sourcesSupabase

            .from("source_people")

            .select("person_id")

            .eq(
                "source_id",
                source.id
            );


        if (sourcePeopleError) {
            throw sourcePeopleError;
        }


        const selectedIds =
            (sourcePeople || [])
                .map(
                    row =>
                        String(
                            row.person_id
                        )
                );


        const peopleSelect =
            document.getElementById(
                "source-people"
            );


        if (peopleSelect) {

            Array.from(
                peopleSelect.options
            ).forEach(
                option => {

                    option.selected =
                        selectedIds.includes(
                            String(
                                option.value
                            )
                        );
                }
            );
        }


        /* ---------------------------------
           CHANGE BUTTON
           --------------------------------- */

        const submitButton =
            document.getElementById(
                "add-source"
            );


        if (submitButton) {

            submitButton.textContent =
                "Update Source";

        }


        const cancelButton =
            document.getElementById(
                "cancel-source-edit"
            );


        if (cancelButton) {

            cancelButton.style.display =
                "inline-block";

        }


        /* ---------------------------------
           SCROLL TO FORM
           --------------------------------- */

        document.getElementById(
            "source-title"
        )?.scrollIntoView({
            behavior:
                "smooth",

            block:
                "center"
        });


    } catch (error) {

        console.error(
            "CBRA: Failed to edit source:",
            error
        );


        const message =
            document.getElementById(
                "source-message"
            );


        if (message) {

            message.textContent =
                "Failed to load source: " +
                error.message;

        }
    }
}


/* -----------------------------------------
   REMOVE SOURCE
   ----------------------------------------- */

async function removeSource(
    sourceId
) {

    const confirmed =
        confirm(
            "Are you sure you want to remove this source?"
        );


    if (!confirmed) {
        return;
    }


    try {

        /* ---------------------------------
           REMOVE SOURCE PEOPLE
           --------------------------------- */

        const {
            error: peopleDeleteError
        } = await sourcesSupabase

            .from("source_people")

            .delete()

            .eq(
                "source_id",
                Number(sourceId)
            );


        if (peopleDeleteError) {
            throw peopleDeleteError;
        }


        /* ---------------------------------
           REMOVE SOURCE
           --------------------------------- */

        const {
            error: sourceDeleteError
        } = await sourcesSupabase

            .from("sources")

            .delete()

            .eq(
                "id",
                Number(sourceId)
            );


        if (sourceDeleteError) {
            throw sourceDeleteError;
        }


        /* ---------------------------------
           RESET FORM IF EDITING THIS SOURCE
           --------------------------------- */

        const editId =
            document.getElementById(
                "source-edit-id"
            );


        if (
            editId &&
            Number(editId.value) ===
                Number(sourceId)
        ) {

            resetSourceForm();

        }


        await loadManageSources();


    } catch (error) {

        console.error(
            "CBRA: Failed to remove source:",
            error
        );


        alert(
            "Failed to remove source:\n\n" +
            error.message
        );
    }
}


/* -----------------------------------------
   RESET SOURCE FORM
   ----------------------------------------- */

function resetSourceForm() {

    const form =
        document.getElementById(
            "sources-form"
        );


    if (form) {
        form.reset();
    }


    const editId =
        document.getElementById(
            "source-edit-id"
        );


    if (editId) {

        editId.value =
            "";

    }


    const submitButton =
        document.getElementById(
            "add-source"
        );


    if (submitButton) {

        submitButton.textContent =
            "Add Source";

    }


    const cancelButton =
        document.getElementById(
            "cancel-source-edit"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }
}


/* -----------------------------------------
   CANCEL EDIT
   ----------------------------------------- */

function cancelSourceEdit() {

    resetSourceForm();


    const message =
        document.getElementById(
            "source-message"
        );


    if (message) {

        message.textContent =
            "";

    }
}


/* -----------------------------------------
   INITIALIZE
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        buildSourcesManagementUI();


        const form =
            document.getElementById(
                "sources-form"
            );


        if (form) {

            form.addEventListener(
                "submit",
                saveSource
            );

        }


        const cancelButton =
            document.getElementById(
                "cancel-source-edit"
            );


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                cancelSourceEdit
            );

        }

    }
);


/* -----------------------------------------
   GLOBAL EXPORTS
   ----------------------------------------- */

window.loadManageSources =
    loadManageSources;


window.loadSourcePeople =
    loadSourcePeople;


window.editSource =
    editSource;


window.removeSource =
    removeSource;


window.saveSource =
    saveSource;


window.cancelSourceEdit =
    cancelSourceEdit;