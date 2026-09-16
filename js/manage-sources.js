/* =========================================
   CBRA — MANAGE SOURCES
   ========================================= */

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
        const id = window.getCurrentCaseId();

        if (id) {
            return Number(id);
        }
    }

    const selector =
        document.getElementById("case-selector");

    if (selector && selector.value) {
        return Number(selector.value);
    }

    return null;
}


/* -----------------------------------------
   BUILD SOURCE MANAGEMENT UI
   ----------------------------------------- */

function buildSourcesManagementUI() {

    const container =
        document.getElementById("sources-management");

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

                        ${SOURCE_TYPES.map(type => `
                            <option value="${escapeSourceHtml(type)}">
                                ${escapeSourceHtml(type)}
                            </option>
                        `).join("")}

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
                        Hold Ctrl while clicking to select
                        multiple people.
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

    loadSourcePeople();
    loadManageSources();
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
   LOAD PEOPLE FOR CURRENT CASE
   ----------------------------------------- */

async function loadSourcePeople() {

    const select =
        document.getElementById("source-people");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option disabled>
            Loading people...
        </option>
    `;

    const caseId =
        getSourceManagementCaseId();

    if (!caseId) {

        select.innerHTML = `
            <option disabled>
                Select a case first
            </option>
        `;

        return;
    }

    try {

        const {
            data: casePeople,
            error: casePeopleError
        } = await sourcesSupabase
            .from("case_people")
            .select("person_id")
            .eq("case_id", caseId);

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
            casePeople.map(
                person => person.person_id
            );

        const {
            data: people,
            error: peopleError
        } = await sourcesSupabase
            .from("people")
            .select("id,display_name")
            .in("id", personIds)
            .order("display_name");

        if (peopleError) {
            throw peopleError;
        }

        select.innerHTML = "";

        (people || []).forEach(person => {

            const option =
                document.createElement("option");

            option.value = person.id;

            option.textContent =
                person.display_name ||
                "Unnamed Person";

            select.appendChild(option);
        });

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

async function loadManageSources(caseId = null) {

    const list =
        document.getElementById("source-list");

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

        const {
            data: sources,
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
            .eq("case_id", numericCaseId)
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
                <p>No sources have been added to this case.</p>
            `;

            return;
        }

        list.innerHTML = "";

        for (const source of sources) {

            let peopleText = "";

            try {

                const {
                    data: sourcePeople
                } = await sourcesSupabase
                    .from("source_people")
                    .select(`
                        people (
                            id,
                            display_name
                        )
                    `)
                    .eq("source_id", source.id);

                if (
                    sourcePeople &&
                    sourcePeople.length
                ) {

                    peopleText =
                        sourcePeople
                            .map(row =>
                                row.people?.display_name
                            )
                            .filter(Boolean)
                            .join(", ");
                }

            } catch (peopleError) {

                console.warn(
                    "CBRA: Could not load source people:",
                    peopleError
                );
            }


            const card =
                document.createElement("div");

            card.className =
                "management-card";


            const dateText =
                source.publication_date
                    ? new Date(
                        source.publication_date +
                        "T00:00:00"
                    ).toLocaleDateString()
                    : "No date";


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
                            source.source_type
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
                                    <strong>People:</strong>
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

            list.appendChild(card);
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


    const sourceType =
        document.getElementById(
            "source-type"
        )?.value;


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
            ).map(option =>
                Number(option.value)
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
                    title: title,
                    source_type: sourceType,
                    publication_date:
                        publicationDate,
                    url: url,
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

            sourceId = data.id;


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
                    title: title,
                    source_type: sourceType,
                    publication_date:
                        publicationDate,
                    url: url,

                    /*
                     * IMPORTANT:
                     * Your sources table has a
                     * case_id column.
                     */
                    case_id:
                        numericCurrentCaseId
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            sourceId = data.id;
        }


        /* ---------------------------------
           SOURCE PEOPLE
           --------------------------------- */

        await sourcesSupabase
            .from("source_people")
            .delete()
            .eq(
                "source_id",
                sourceId
            );


        if (
            selectedPeople.length > 0
        ) {

            const rows =
                selectedPeople.map(
                    personId => ({
                        source_id: sourceId,
                        person_id: personId
                    })
                );


            const {
                error: peopleInsertError
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


        await loadSourcePeople();
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

async function editSource(sourceId) {

    try {

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


        document.getElementById(
            "source-edit-id"
        ).value = source.id;


        document.getElementById(
            "source-title"
        ).value =
            source.title || "";


        document.getElementById(
            "source-type"
        ).value =
            source.source_type || "";


        document.getElementById(
            "source-date"
        ).value =
            source.publication_date || "";


        document.getElementById(
            "source-url"
        ).value =
            source.url || "";


        await loadSourcePeople();


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
                .map(row =>
                    String(row.person_id)
                );


        const peopleSelect =
            document.getElementById(
                "source-people"
            );


        if (peopleSelect) {

            Array.from(
                peopleSelect.options
            ).forEach(option => {

                option.selected =
                    selectedIds.includes(
                        String(option.value)
                    );

            });
        }


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


        document.getElementById(
            "source-title"
        )?.scrollIntoView({
            behavior: "smooth",
            block: "center"
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

async function removeSource(sourceId) {

    const confirmed =
        confirm(
            "Are you sure you want to remove this source?"
        );

    if (!confirmed) {
        return;
    }


    try {

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
        editId.value = "";
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
        message.textContent = "";
    }
}


/* -----------------------------------------
   CASE CHANGE LISTENER
   ----------------------------------------- */

function initializeSourceCaseListener() {

    const selector =
        document.getElementById(
            "case-selector"
        );

    if (!selector) {
        return;
    }


    selector.addEventListener(
        "change",
        async function () {

            await loadSourcePeople();
            await loadManageSources(
                selector.value
            );

        }
    );
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


        initializeSourceCaseListener();

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