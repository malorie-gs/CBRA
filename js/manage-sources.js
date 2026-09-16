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
// GET CURRENT CASE ID
// ==================================================

function getSourceManagementCaseId() {

    const selector =
        document.getElementById(
            "case-selector"
        );

    if (
        selector &&
        selector.value
    ) {

        const id =
            Number(selector.value);

        if (
            Number.isFinite(id)
        ) {
            return id;
        }
    }


    if (
        typeof window.getCurrentCaseId ===
        "function"
    ) {

        const id =
            Number(
                window.getCurrentCaseId()
            );

        if (
            Number.isFinite(id)
        ) {
            return id;
        }
    }


    return null;
}


// ==================================================
// SHOW MESSAGE
// ==================================================

function showSourceMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "source-message"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.style.color =
        isError
            ? "red"
            : "";
}


// ==================================================
// BUILD SOURCES MANAGEMENT UI
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

                        ${SOURCE_TYPES
                            .map(
                                function(type) {

                                    return `
                                        <option
                                            value="${escapeHtml(type)}"
                                        >
                                            ${escapeHtml(type)}
                                        </option>
                                    `;

                                }
                            )
                            .join("")
                        }

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
                        URL *
                    </label>

                    <input
                        type="url"
                        id="source-url"
                        placeholder="https://..."
                        required
                    >

                </div>


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
                        The currently selected case is automatically connected.
                        Hold Ctrl while clicking to select additional cases.
                    </small>

                </div>


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


        <div class="management-subsection">

            <h3>
                Sources & References
            </h3>

            <div id="source-list">

                <p>
                    Select a case to view its sources.
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
            "CBRA: Error loading source cases:",
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


    const currentCaseId =
        getSourceManagementCaseId();


    const selectedSet =
        new Set(
            selectedCaseIds.map(
                Number
            )
        );


    if (currentCaseId) {

        selectedSet.add(
            Number(currentCaseId)
        );

    }


    data.forEach(
        function(caseData) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(caseData.id);

            option.textContent =
                caseData.case_name ||
                "Unnamed Case";

            if (
                selectedSet.has(
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
            "CBRA: Error loading people for source:",
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


    if (
        personIds.length === 0
    ) {

        selector.innerHTML = `
            <option disabled>
                No people are connected to this case
            </option>
        `;

        return;
    }


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
            "CBRA: Error loading source people:",
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


    const selectedSet =
        new Set(
            selectedPeopleIds.map(
                Number
            )
        );


    people.forEach(
        function(person) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(person.id);

            option.textContent =
                person.display_name ||
                "Unnamed Person";

            if (
                selectedSet.has(
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
            "CBRA: Error loading source cases:",
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
            "CBRA: Error loading source people:",
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
// LOAD SOURCES FOR CURRENT CASE ONLY
// ==================================================

async function loadSources() {

    const container =
        document.getElementById(
            "source-list"
        );

    if (!container) {
        return;
    }


    const currentCaseId =
        getSourceManagementCaseId();


    if (!currentCaseId) {

        container.innerHTML = `
            <p>
                Select a case to view its sources.
            </p>
        `;

        return;
    }


    container.innerHTML =
        "<p>Loading sources...</p>";


    // ----------------------------------------------
    // Get ONLY source IDs connected to this case
    // ----------------------------------------------

    const {
        data: connections,
        error: connectionError
    } =
        await sourcesSupabase
            .from("source_cases")
            .select("source_id")
            .eq(
                "case_id",
                currentCaseId
            );


    if (connectionError) {

        console.error(
            "CBRA: Error loading source connections:",
            connectionError
        );

        container.innerHTML = `
            <p>
                Unable to load sources for this case.
            </p>
        `;

        return;
    }


    const sourceIds =
        (connections || [])
            .map(
                function(row) {

                    return Number(
                        row.source_id
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


    if (
        sourceIds.length === 0
    ) {

        container.innerHTML = `
            <p>
                No sources have been connected to this case yet.
            </p>
        `;

        return;
    }


    // ----------------------------------------------
    // Load those exact sources
    // ----------------------------------------------

    const {
        data: sources,
        error: sourcesError
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
            );


    if (sourcesError) {

        console.error(
            "CBRA: Error loading sources:",
            sourcesError
        );

        container.innerHTML = `
            <p>
                Unable to load sources.
            </p>
        `;

        return;
    }


    if (
        !sources ||
        sources.length === 0
    ) {

        container.innerHTML = `
            <p>
                No sources have been added yet.
            </p>
        `;

        return;
    }


    sources.sort(
        function(a, b) {

            if (!a.publication_date) {
                return 1;
            }

            if (!b.publication_date) {
                return -1;
            }

            return (
                new Date(b.publication_date) -
                new Date(a.publication_date)
            );

        }
    );


    container.innerHTML = "";


    for (
        const source of sources
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


            <p>
                <strong>
                    Type:
                </strong>

                ${escapeHtml(
                    source.source_type ||
                    "—"
                )}
            </p>


            <p>
                <strong>
                    Date:
                </strong>

                ${
                    source.publication_date
                        ? escapeHtml(
                            new Date(
                                source.publication_date
                            ).toLocaleDateString(
                                "en-US",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                }
                            )
                        )
                        : "—"
                }
            </p>


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

    const caseSelector =
        document.getElementById(
            "source-cases"
        );

    const peopleSelector =
        document.getElementById(
            "source-people"
        );


    const title =
        titleInput
            ? titleInput.value.trim()
            : "";


    const sourceType =
        typeInput
            ? typeInput.value
            : "";


    const publicationDate =
        dateInput &&
        dateInput.value
            ? dateInput.value
            : null;


    const url =
        urlInput
            ? urlInput.value.trim()
            : "";


    const currentCaseId =
        getSourceManagementCaseId();


    if (!currentCaseId) {

        showSourceMessage(
            "Please select a case first.",
            true
        );

        return;
    }


    if (!title) {

        showSourceMessage(
            "Please enter a source title.",
            true
        );

        return;
    }


    if (!sourceType) {

        showSourceMessage(
            "Please select a source type.",
            true
        );

        return;
    }


    if (!url) {

        showSourceMessage(
            "Please enter the source URL.",
            true
        );

        return;
    }


    // ----------------------------------------------
    // Get selected cases
    // ----------------------------------------------

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


    // ALWAYS connect current case
    if (
        !selectedCases.includes(
            Number(currentCaseId)
        )
    ) {

        selectedCases.push(
            Number(currentCaseId)
        );

    }


    // ----------------------------------------------
    // Get selected people
    // ----------------------------------------------

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


    const form =
        document.getElementById(
            "sources-form"
        );


    const editingId =
        form &&
        form.dataset.editingId
            ? Number(
                form.dataset.editingId
            )
            : null;


    showSourceMessage(
        editingId
            ? "Updating source..."
            : "Adding source..."
    );


    let sourceId =
        editingId;


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
                    editingId
                )
                .select("id")
                .single();


        if (error) {

            console.error(
                "CBRA: Error updating source:",
                error
            );

            showSourceMessage(
                error.message ||
                "Unable to update source.",
                true
            );

            return;
        }


        sourceId =
            Number(
                data.id
            );

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
                "CBRA: Error creating source:",
                error
            );

            showSourceMessage(
                error.message ||
                "Unable to create source.",
                true
            );

            return;
        }


        sourceId =
            Number(
                data.id
            );
    }


    // ==================================================
    // REBUILD CASE CONNECTIONS
    // ==================================================

    const {
        error: deleteCaseError
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
            "CBRA: Error clearing source case connections:",
            deleteCaseError
        );

        showSourceMessage(
            "Source was saved, but its case connections could not be updated.",
            true
        );

        return;
    }


    const caseRows =
        selectedCases.map(
            function(id) {

                return {
                    source_id:
                        sourceId,

                    case_id:
                        id
                };

            }
        );


    if (
        caseRows.length > 0
    ) {

        const {
            error: insertCaseError
        } =
            await sourcesSupabase
                .from("source_cases")
                .insert(
                    caseRows
                );


        if (insertCaseError) {

            console.error(
                "CBRA: Error inserting source case connections:",
                insertCaseError
            );

            showSourceMessage(
                "Source was saved, but the case connection could not be created.",
                true
            );

            return;
        }
    }


    // ==================================================
    // REBUILD PEOPLE CONNECTIONS
    // ==================================================

    const {
        error: deletePeopleError
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
            "CBRA: Error clearing source people connections:",
            deletePeopleError
        );

        showSourceMessage(
            "Source was saved, but its people connections could not be updated.",
            true
        );

        return;
    }


    if (
        selectedPeople.length > 0
    ) {

        const peopleRows =
            selectedPeople.map(
                function(id) {

                    return {
                        source_id:
                            sourceId,

                        person_id:
                            id
                    };

                }
            );


        const {
            error: insertPeopleError
        } =
            await sourcesSupabase
                .from("source_people")
                .insert(
                    peopleRows
                );


        if (insertPeopleError) {

            console.error(
                "CBRA: Error inserting source people connections:",
                insertPeopleError
            );

            showSourceMessage(
                "Source was saved, but its people connections could not be saved.",
                true
            );

            return;
        }
    }


    // ==================================================
    // VERIFY CASE CONNECTION
    // ==================================================

    const {
        data: verification,
        error: verificationError
    } =
        await sourcesSupabase
            .from("source_cases")
            .select("source_id, case_id")
            .eq(
                "source_id",
                sourceId
            )
            .eq(
                "case_id",
                currentCaseId
            );


    if (verificationError) {

        console.error(
            "CBRA: Error verifying source connection:",
            verificationError
        );

        showSourceMessage(
            "Source saved, but the case connection could not be verified.",
            true
        );

        return;
    }


    if (
        !verification ||
        verification.length === 0
    ) {

        showSourceMessage(
            "Source was saved, but it is not connected to the selected case.",
            true
        );

        return;
    }


    // ==================================================
    // SUCCESS
    // ==================================================

    showSourceMessage(
        editingId
            ? "Source updated successfully."
            : "Source added successfully."
    );


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
            "CBRA: Error loading source:",
            error
        );

        showSourceMessage(
            error.message ||
            "Unable to load source.",
            true
        );

        return;
    }


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


    const currentCaseId =
        getSourceManagementCaseId();


    if (
        currentCaseId &&
        !caseIds.includes(
            Number(currentCaseId)
        )
    ) {

        caseIds.push(
            Number(currentCaseId)
        );

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


    if (titleInput) {

        titleInput.value =
            source.title || "";

    }


    if (typeInput) {

        typeInput.value =
            source.source_type || "";

    }


    if (dateInput) {

        dateInput.value =
            source.publication_date || "";

    }


    if (urlInput) {

        urlInput.value =
            source.url || "";

    }


    if (form) {

        form.dataset.editingId =
            String(sourceId);

    }


    if (submitButton) {

        submitButton.textContent =
            "Update Source";

    }


    if (cancelButton) {

        cancelButton.style.display =
            "inline-block";

    }


    await loadSourceCases(
        caseIds
    );


    await loadSourcePeople(
        peopleIds
    );


    showSourceMessage(
        "Editing source."
    );


    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
}


// ==================================================
// CANCEL SOURCE EDIT
// ==================================================

async function cancelSourceEdit() {

    resetSourceForm();

    showSourceMessage("");

    await loadSourceCases();

    await loadSourcePeople();

    await loadSources();
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


    showSourceMessage(
        "Removing source..."
    );


    // ----------------------------------------------
    // Remove people connections
    // ----------------------------------------------

    const {
        error: peopleDeleteError
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
            "CBRA: Error removing source people connections:",
            peopleDeleteError
        );

        showSourceMessage(
            "Unable to remove source people connections.",
            true
        );

        return;
    }


    // ----------------------------------------------
    // Remove case connections
    // ----------------------------------------------

    const {
        error: caseDeleteError
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
            "CBRA: Error removing source case connections:",
            caseDeleteError
        );

        showSourceMessage(
            "Unable to remove source case connections.",
            true
        );

        return;
    }


    // ----------------------------------------------
    // Remove source
    // ----------------------------------------------

    const {
        error: sourceDeleteError
    } =
        await sourcesSupabase
            .from("sources")
            .delete()
            .eq(
                "id",
                sourceId
            );


    if (sourceDeleteError) {

        console.error(
            "CBRA: Error removing source:",
            sourceDeleteError
        );

        showSourceMessage(
            sourceDeleteError.message ||
            "Unable to remove source.",
            true
        );

        return;
    }


    showSourceMessage(
        "Source removed successfully."
    );


    await loadSources();
}


// ==================================================
// RELOAD WHEN CASE CHANGES
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

            resetSourceForm();

            showSourceMessage("");

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
// GLOBAL FUNCTIONS
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