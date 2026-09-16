// ==================================================
// CBRA — MANAGE SOURCES
// ==================================================
//
// Sources are reusable references.
//
// A source can be connected to:
// - One or more cases
// - One or more people
//
// Sources can then be referenced by:
// - Case documents
// - Crime-scene photos
// - General media
// - Person records
//
// ==================================================


const sourcesSupabase =
    window.supabaseClient;


// ==================================================
// SOURCE TYPE OPTIONS
// ==================================================

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


// ==================================================
// GET CURRENT CASE ID
// ==================================================

function getSourceManagementCaseId() {

    if (
        typeof window.getCurrentCaseId ===
        "function"
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


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(value) {

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


// ==================================================
// BUILD SOURCES MANAGEMENT INTERFACE
// ==================================================

function buildSourcesManagementUI() {

    const container =
        document.getElementById(
            "sources-management"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="management-subsection">

            <h3>
                Add Source / Reference
            </h3>


            <form id="sources-form">

                <!-- TITLE -->

                <div class="form-group">

                    <label for="source-title">
                        Title *
                    </label>

                    <input
                        type="text"
                        id="source-title"
                        placeholder="Example: National Post article"
                        required
                    >

                </div>


                <!-- SOURCE TYPE -->

                <div class="form-group">

                    <label for="source-type">
                        Source Type *
                    </label>

                    <select
                        id="source-type"
                        required
                    >

                        <option value="">
                            -- Select Source Type --
                        </option>

                        ${SOURCE_TYPES.map(
                            function(type) {

                                return `
                                    <option value="${escapeHtml(type)}">
                                        ${escapeHtml(type)}
                                    </option>
                                `;

                            }
                        ).join("")}

                    </select>

                </div>


                <!-- PUBLICATION DATE -->

                <div class="form-group">

                    <label for="source-date">
                        Publication Date
                    </label>

                    <input
                        type="date"
                        id="source-date"
                    >

                </div>


                <!-- URL -->

                <div class="form-group">

                    <label for="source-url">
                        URL *
                    </label>

                    <input
                        type="url"
                        id="source-url"
                        placeholder="https://..."
                        required
                    >

                </div>


                <!-- CASES -->

                <div class="form-group">

                    <label for="source-cases">
                        Cases
                    </label>

                    <select
                        id="source-cases"
                        multiple
                        size="6"
                    ></select>

                    <small>
                        Hold Ctrl while clicking to select multiple cases.
                    </small>

                </div>


                <!-- PEOPLE -->

                <div class="form-group">

                    <label for="source-people">
                        People
                    </label>

                    <select
                        id="source-people"
                        multiple
                        size="6"
                    ></select>

                    <small>
                        Only people connected to the selected case are shown.
                        Hold Ctrl while clicking to select multiple people.
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


                <p
                    id="source-message"
                    class="form-message"
                ></p>

            </form>

        </div>


        <!-- EXISTING SOURCES -->

        <div class="management-subsection">

            <h3>
                Sources & References
            </h3>

            <div
                id="source-list"
            >
                <p>
                    Loading sources...
                </p>
            </div>

        </div>

    `;


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


    loadSourceCases();

    loadSourcePeople();

    loadSources();
}


// ==================================================
// LOAD CASES
// ==================================================

async function loadSourceCases(
    selectedCaseIds = []
) {

    const selector =
        document.getElementById(
            "source-cases"
        );


    if (!selector) {
        return;
    }


    selector.innerHTML = "";


    const {
        data,
        error
    } =
        await sourcesSupabase
            .from("cases")
            .select(`
                id,
                case_name,
                case_date
            `)
            .order(
                "case_date",
                {
                    ascending: false,
                    nullsFirst: false
                }
            );


    if (error) {

        console.error(
            "Error loading source cases:",
            error
        );

        selector.innerHTML = `
            <option disabled>
                Unable to load cases
            </option>
        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        selector.innerHTML = `
            <option disabled>
                No cases available
            </option>
        `;

        return;
    }


    data.forEach(
        function(caseData) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    caseData.id
                );


            option.textContent =
                caseData.case_name ||
                "Unnamed Case";


            if (
                selectedCaseIds.includes(
                    Number(caseData.id)
                )
            ) {

                option.selected =
                    true;

            }


            selector.appendChild(
                option
            );

        }
    );
}


// ==================================================
// LOAD PEOPLE FOR CURRENT CASE
// ==================================================

async function loadSourcePeople(
    selectedPeopleIds = []
) {

    const selector =
        document.getElementById(
            "source-people"
        );


    if (!selector) {
        return;
    }


    selector.innerHTML = "";


    const caseId =
        getSourceManagementCaseId();


    if (!caseId) {

        selector.innerHTML = `
            <option disabled>
                Select a case first
            </option>
        `;

        return;
    }


    // ----------------------------------------------
    // Get people connected to current case
    // ----------------------------------------------

    const {
        data: casePeople,
        error: casePeopleError
    } =
        await sourcesSupabase
            .from("case_people")
            .select(`
                person_id
            `)
            .eq(
                "case_id",
                caseId
            );


    if (casePeopleError) {

        console.error(
            "Error loading case people for sources:",
            casePeopleError
        );

        selector.innerHTML = `
            <option disabled>
                Unable to load people
            </option>
        `;

        return;
    }


    const personIds =
        (casePeople || [])
            .map(
                function(row) {

                    return Number(
                        row.person_id
                    );

                }
            )
            .filter(
                function(id) {

                    return Number.isFinite(
                        id
                    );

                }
            );


    if (personIds.length === 0) {

        selector.innerHTML = `
            <option disabled>
                No people are connected to this case
            </option>
        `;

        return;
    }


    // ----------------------------------------------
    // Load those people
    // ----------------------------------------------

    const {
        data: people,
        error: peopleError
    } =
        await sourcesSupabase
            .from("people")
            .select(`
                id,
                display_name
            `)
            .in(
                "id",
                personIds
            )
            .order(
                "display_name",
                {
                    ascending: true
                }
            );


    if (peopleError) {

        console.error(
            "Error loading source people:",
            peopleError
        );

        selector.innerHTML = `
            <option disabled>
                Unable to load people
            </option>
        `;

        return;
    }


    if (
        !people ||
        people.length === 0
    ) {

        selector.innerHTML = `
            <option disabled>
                No people are connected to this case
            </option>
        `;

        return;
    }


    people.forEach(
        function(person) {

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


            if (
                selectedPeopleIds.includes(
                    Number(person.id)
                )
            ) {

                option.selected =
                    true;

            }


            selector.appendChild(
                option
            );

        }
    );
}


// ==================================================
// GET SOURCE CASES
// ==================================================

async function getSourceCases(
    sourceId
) {

    const {
        data,
        error
    } =
        await sourcesSupabase
            .from("source_cases")
            .select(`
                case_id,
                case:cases (
                    id,
                    case_name
                )
            `)
            .eq(
                "source_id",
                sourceId
            );


    if (error) {

        console.error(
            "Error loading source cases:",
            error
        );

        return [];
    }


    return (
        data || []
    )
        .map(
            function(connection) {

                return connection.case;

            }
        )
        .filter(
            function(caseData) {

                return Boolean(
                    caseData
                );

            }
        );
}


// ==================================================
// GET SOURCE PEOPLE
// ==================================================

async function getSourcePeople(
    sourceId
) {

    const {
        data,
        error
    } =
        await sourcesSupabase
            .from("source_people")
            .select(`
                person_id,
                person:people (
                    id,
                    display_name
                )
            `)
            .eq(
                "source_id",
                sourceId
            );


    if (error) {

        console.error(
            "Error loading source people:",
            error
        );

        return [];
    }


    return (
        data || []
    )
        .map(
            function(connection) {

                return connection.person;

            }
        )
        .filter(
            function(person) {

                return Boolean(
                    person
                );

            }
        );
}


// ==================================================
// LOAD EXISTING SOURCES
// ==================================================

async function loadSources() {

    const container =
        document.getElementById(
            "source-list"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "<p>Loading sources...</p>";


    const currentCaseId =
        getSourceManagementCaseId();


    if (!currentCaseId) {

        container.innerHTML =
            "<p>Select a case to view its sources.</p>";

        return;
    }


    // ----------------------------------------------
    // Get source IDs connected to current case
    // ----------------------------------------------

    const {
        data: sourceConnections,
        error: connectionError
    } =
        await sourcesSupabase
            .from("source_cases")
            .select(`
                source_id
            `)
            .eq(
                "case_id",
                currentCaseId
            );


    if (connectionError) {

        console.error(
            "Error loading case source connections:",
            connectionError
        );

        container.innerHTML =
            "<p>Unable to load sources for this case.</p>";

        return;
    }


    const sourceIds =
        (sourceConnections || [])
            .map(
                function(connection) {

                    return Number(
                        connection.source_id
                    );

                }
            )
            .filter(
                function(id) {

                    return Number.isFinite(
                        id
                    );

                }
            );


    if (sourceIds.length === 0) {

        container.innerHTML =
            "<p>No sources have been connected to this case yet.</p>";

        return;
    }


    // ----------------------------------------------
    // Load ONLY those sources
    // ----------------------------------------------

    const {
        data,
        error
    } =
        await sourcesSupabase
            .from("sources")
            .select(`
                id,
                title,
                source_type,
                publication_date,
                url
            `)
            .in(
                "id",
                sourceIds
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
            "Error loading sources:",
            error
        );

        container.innerHTML =
            "<p>Unable to load sources.</p>";

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "<p>No sources have been added yet.</p>";

        return;
    }


    container.innerHTML = "";


    for (
        const source of data
    ) {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "source-card";


        const cases =
            await getSourceCases(
                source.id
            );


        const people =
            await getSourcePeople(
                source.id
            );


        card.innerHTML = `

            <h4>
                ${escapeHtml(
                    source.title ||
                    "Untitled Source"
                )}
            </h4>


            ${
                source.source_type
                    ? `
                        <p>
                            <strong>
                                Type:
                            </strong>

                            ${escapeHtml(
                                source.source_type
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                source.publication_date
                    ? `
                        <p>
                            <strong>
                                Date:
                            </strong>

                            ${escapeHtml(
                                source.publication_date
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                cases.length > 0
                    ? `
                        <p>
                            <strong>
                                Cases:
                            </strong>

                            ${cases
                                .map(
                                    function(caseData) {

                                        return escapeHtml(
                                            caseData.case_name ||
                                            "Unnamed Case"
                                        );

                                    }
                                )
                                .join(", ")}
                        </p>
                    `
                    : ""
            }


            ${
                people.length > 0
                    ? `
                        <p>
                            <strong>
                                People:
                            </strong>

                            ${people
                                .map(
                                    function(person) {

                                        return escapeHtml(
                                            person.display_name ||
                                            "Unnamed Person"
                                        );

                                    }
                                )
                                .join(", ")}
                        </p>
                    `
                    : ""
            }


            ${
                source.url
                    ? `
                        <p>
                            <a
                                href="${escapeHtml(
                                    source.url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open Source
                            </a>
                        </p>
                    `
                    : ""
            }


            <div class="source-actions">

                <button
                    type="button"
                    onclick="editSource(${Number(source.id)})"
                >
                    Edit
                </button>


                <button
                    type="button"
                    onclick="removeSource(${Number(source.id)})"
                >
                    Remove
                </button>

            </div>

        `;


        container.appendChild(
            card
        );
    }
}


// ==================================================
// SAVE SOURCE
// ==================================================

async function saveSource(
    event
) {

    event.preventDefault();


    const message =
        document.getElementById(
            "source-message"
        );


    const title =
        document.getElementById(
            "source-title"
        ).value.trim();


    const sourceType =
        document.getElementById(
            "source-type"
        ).value;


    const publicationDate =
        document.getElementById(
            "source-date"
        ).value || null;


    const url =
        document.getElementById(
            "source-url"
        ).value.trim();


    const caseSelector =
        document.getElementById(
            "source-cases"
        );


    const peopleSelector =
        document.getElementById(
            "source-people"
        );


    const selectedCases =
        Array.from(
            caseSelector
                ? caseSelector.selectedOptions
                : []
        )
            .map(
                function(option) {

                    return Number(
                        option.value
                    );

                }
            )
            .filter(
                function(id) {

                    return Number.isFinite(
                        id
                    );

                }
            );


    const selectedPeople =
        Array.from(
            peopleSelector
                ? peopleSelector.selectedOptions
                : []
        )
            .map(
                function(option) {

                    return Number(
                        option.value
                    );

                }
            )
            .filter(
                function(id) {

                    return Number.isFinite(
                        id
                    );

                }
            );


    if (!title) {

        if (message) {

            message.textContent =
                "Please enter a source title.";

        }

        return;
    }


    if (!sourceType) {

        if (message) {

            message.textContent =
                "Please select a source type.";

        }

        return;
    }


    if (!url) {

        if (message) {

            message.textContent =
                "Please enter the source URL.";

        }

        return;
    }


    // ----------------------------------------------
    // Make sure current case stays connected
    // ----------------------------------------------

    const currentCaseId =
        getSourceManagementCaseId();


    if (
        currentCaseId &&
        !selectedCases.includes(
            Number(currentCaseId)
        )
    ) {

        selectedCases.push(
            Number(currentCaseId)
        );

    }


    const form =
        document.getElementById(
            "sources-form"
        );


    const editingId =
        form &&
        form.dataset
            ? form.dataset.editingId || null
            : null;


    if (message) {

        message.textContent =
            editingId
                ? "Updating source..."
                : "Adding source...";

    }


    let sourceId =
        editingId
            ? Number(editingId)
            : null;


    // ==================================================
    // CREATE OR UPDATE SOURCE
    // ==================================================

    if (editingId) {

        const {
            data,
            error
        } =
            await sourcesSupabase
                .from("sources")
                .update({
                    title:
                        title,

                    source_type:
                        sourceType,

                    publication_date:
                        publicationDate,

                    url:
                        url
                })
                .eq(
                    "id",
                    sourceId
                )
                .select("id")
                .single();


        if (error) {

            console.error(
                "Error updating source:",
                error
            );

            if (message) {

                message.textContent =
                    error.message ||
                    "Unable to update source.";

            }

            return;
        }


        sourceId =
            data.id;

    } else {

        const {
            data,
            error
        } =
            await sourcesSupabase
                .from("sources")
                .insert({
                    title:
                        title,

                    source_type:
                        sourceType,

                    publication_date:
                        publicationDate,

                    url:
                        url
                })
                .select("id")
                .single();


        if (error) {

            console.error(
                "Error creating source:",
                error
            );

            if (message) {

                message.textContent =
                    error.message ||
                    "Unable to create source.";

            }

            return;
        }


        sourceId =
            data.id;
    }


    // ==================================================
    // UPDATE CASE CONNECTIONS
    // ==================================================

    const {
        error:
            deleteCaseError
    } =
        await sourcesSupabase
            .from("source_cases")
            .delete()
            .eq(
                "source_id",
                sourceId
            );


    if (deleteCaseError) {

        console.error(
            "Error clearing source cases:",
            deleteCaseError
        );

        if (message) {

            message.textContent =
                "Source saved, but case connections could not be updated.";

        }

        return;
    }


    if (
        selectedCases.length > 0
    ) {

        const caseRows =
            selectedCases.map(
                function(caseId) {

                    return {
                        source_id:
                            sourceId,

                        case_id:
                            caseId
                    };

                }
            );


        const {
            error:
                insertCaseError
        } =
            await sourcesSupabase
                .from("source_cases")
                .insert(
                    caseRows
                );


        if (insertCaseError) {

            console.error(
                "Error saving source cases:",
                insertCaseError
            );

            if (message) {

                message.textContent =
                    "Source saved, but case connections could not be saved.";

            }

            return;
        }
    }


    // ==================================================
    // UPDATE PEOPLE CONNECTIONS
    // ==================================================

    const {
        error:
            deletePeopleError
    } =
        await sourcesSupabase
            .from("source_people")
            .delete()
            .eq(
                "source_id",
                sourceId
            );


    if (deletePeopleError) {

        console.error(
            "Error clearing source people:",
            deletePeopleError
        );

        if (message) {

            message.textContent =
                "Source saved, but people connections could not be updated.";

        }

        return;
    }


    if (
        selectedPeople.length > 0
    ) {

        const peopleRows =
            selectedPeople.map(
                function(personId) {

                    return {
                        source_id:
                            sourceId,

                        person_id:
                            personId
                    };

                }
            );


        const {
            error:
                insertPeopleError
        } =
            await sourcesSupabase
                .from("source_people")
                .insert(
                    peopleRows
                );


        if (insertPeopleError) {

            console.error(
                "Error saving source people:",
                insertPeopleError
            );

            if (message) {

                message.textContent =
                    "Source saved, but people connections could not be saved.";

            }

            return;
        }
    }


    // ==================================================
    // SUCCESS
    // ==================================================

    if (message) {

        message.textContent =
            editingId
                ? "Source updated successfully."
                : "Source added successfully.";

    }


    resetSourceForm();


    await loadSourceCases();

    await loadSourcePeople();

    await loadSources();
}


// ==================================================
// EDIT SOURCE
// ==================================================

async function editSource(
    sourceId
) {

    const {
        data: source,
        error
    } =
        await sourcesSupabase
            .from("sources")
            .select(`
                id,
                title,
                source_type,
                publication_date,
                url
            `)
            .eq(
                "id",
                sourceId
            )
            .single();


    if (error) {

        console.error(
            "Error loading source:",
            error
        );

        return;
    }


    const titleInput =
        document.getElementById(
            "source-title"
        );


    const typeInput =
        document.getElementById(
            "source-type"
        );


    const dateInput =
        document.getElementById(
            "source-date"
        );


    const urlInput =
        document.getElementById(
            "source-url"
        );


    const form =
        document.getElementById(
            "sources-form"
        );


    const submitButton =
        document.getElementById(
            "add-source"
        );


    const cancelButton =
        document.getElementById(
            "cancel-source-edit"
        );


    titleInput.value =
        source.title || "";


    typeInput.value =
        source.source_type || "";


    dateInput.value =
        source.publication_date || "";


    urlInput.value =
        source.url || "";


    form.dataset.editingId =
        String(sourceId);


    submitButton.textContent =
        "Update Source";


    cancelButton.style.display =
        "inline-block";


    // ----------------------------------------------
    // Get existing connections
    // ----------------------------------------------

    const sourceCases =
        await getSourceCases(
            sourceId
        );


    const sourcePeople =
        await getSourcePeople(
            sourceId
        );


    const caseIds =
        sourceCases.map(
            function(caseData) {

                return Number(
                    caseData.id
                );

            }
        );


    const peopleIds =
        sourcePeople.map(
            function(person) {

                return Number(
                    person.id
                );

            }
        );


    // ----------------------------------------------
    // Load selectors with existing selections
    // ----------------------------------------------

    await loadSourceCases(
        caseIds
    );


    /*
     * People selector is intentionally restricted
     * to the current case.
     *
     * If an existing source is connected to a person
     * from another case, that person will not be shown
     * while editing this case.
     */

    await loadSourcePeople(
        peopleIds
    );


    const message =
        document.getElementById(
            "source-message"
        );


    if (message) {

        message.textContent =
            "Editing source.";

    }


    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==================================================
// CANCEL SOURCE EDIT
// ==================================================

function cancelSourceEdit() {

    resetSourceForm();


    const message =
        document.getElementById(
            "source-message"
        );


    if (message) {

        message.textContent = "";

    }


    loadSourceCases();

    loadSourcePeople();

    loadSources();
}


// ==================================================
// RESET SOURCE FORM
// ==================================================

function resetSourceForm() {

    const form =
        document.getElementById(
            "sources-form"
        );


    if (!form) {
        return;
    }


    form.reset();


    delete form.dataset.editingId;


    const submitButton =
        document.getElementById(
            "add-source"
        );


    const cancelButton =
        document.getElementById(
            "cancel-source-edit"
        );


    if (submitButton) {

        submitButton.textContent =
            "Add Source";

    }


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }
}


// ==================================================
// REMOVE SOURCE
// ==================================================

async function removeSource(
    sourceId
) {

    const confirmed =
        confirm(
            "Are you sure you want to remove this source? This will also remove its case and people connections."
        );


    if (!confirmed) {
        return;
    }


    const message =
        document.getElementById(
            "source-message"
        );


    // ==================================================
    // REMOVE CASE CONNECTIONS
    // ==================================================

    const {
        error:
            caseDeleteError
    } =
        await sourcesSupabase
            .from("source_cases")
            .delete()
            .eq(
                "source_id",
                sourceId
            );


    if (caseDeleteError) {

        console.error(
            "Error removing source case connections:",
            caseDeleteError
        );

        if (message) {

            message.textContent =
                "Unable to remove source case connections.";

        }

        return;
    }


    // ==================================================
    // REMOVE PEOPLE CONNECTIONS
    // ==================================================

    const {
        error:
            peopleDeleteError
    } =
        await sourcesSupabase
            .from("source_people")
            .delete()
            .eq(
                "source_id",
                sourceId
            );


    if (peopleDeleteError) {

        console.error(
            "Error removing source people connections:",
            peopleDeleteError
        );

        if (message) {

            message.textContent =
                "Unable to remove source people connections.";

        }

        return;
    }


    // ==================================================
    // REMOVE SOURCE
    // ==================================================

    const {
        error
    } =
        await sourcesSupabase
            .from("sources")
            .delete()
            .eq(
                "id",
                sourceId
            );


    if (error) {

        console.error(
            "Error removing source:",
            error
        );

        if (message) {

            message.textContent =
                error.message ||
                "Unable to remove source.";

        }

        return;
    }


    if (message) {

        message.textContent =
            "Source removed successfully.";

    }


    await loadSources();
}


// ==================================================
// RELOAD SOURCES WHEN CASE CHANGES
// ==================================================

function initializeSourceCaseListener() {

    const caseSelector =
        document.getElementById(
            "case-selector"
        );


    if (!caseSelector) {
        return;
    }


    caseSelector.addEventListener(
        "change",
        async function() {

            await loadSourceCases();

            await loadSourcePeople();

            await loadSources();

        }
    );
}


// ==================================================
// INITIALIZE
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        buildSourcesManagementUI();

        initializeSourceCaseListener();

    }
);


// ==================================================
// MAKE FUNCTIONS AVAILABLE
// ==================================================

window.buildSourcesManagementUI =
    buildSourcesManagementUI;

window.loadSources =
    loadSources;

window.loadSourceCases =
    loadSourceCases;

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