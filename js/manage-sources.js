/* =========================================
   CBRA — MANAGE SOURCES
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const sourcesSupabase = window.supabaseClient;


/* -----------------------------------------
   SOURCE TYPES
   KEEP THESE EXACTLY AS THEY ARE
   ----------------------------------------- */
   
const SOURCE_TYPES = [
    "News Report",
    "Government",
    "YouTube TCC",
    "Documentary",
    "Book",
    "Other"
];

/* -----------------------------------------
   CURRENT EDIT STATE
   ----------------------------------------- */

let editingSourceId = null;


/* -----------------------------------------
   GET CURRENT CASE ID
   ----------------------------------------- */

function getSourcesCaseId() {

    if (typeof window.getCurrentCaseId === "function") {
        return window.getCurrentCaseId();
    }

    const params = new URLSearchParams(
        window.location.search
    );

    return (
        params.get("id") ||
        params.get("case_id")
    );
}


/* -----------------------------------------
   NORMALIZE SOURCE TYPE
   ----------------------------------------- */

function normalizeSourceType(value) {

    if (!value) {
        return "";
    }

    const match = SOURCE_TYPES.find(
        type =>
            type.toLowerCase() ===
            String(value).toLowerCase()
    );

    return match || value;
}


/* -----------------------------------------
   BUILD SOURCES UI
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
        <div class="management-card">

            <div class="management-card-header">

                <h4>
                    Add Source / Reference
                </h4>

                <p>
                    Add a source used to document this case.
                </p>

            </div>


            <form id="source-form">

                <div class="form-grid">


                    <!-- SOURCE TITLE -->

                    <div class="form-group">

                        <label for="source-title">
                            Source Title
                        </label>

                        <input
                            type="text"
                            id="source-title"
                            placeholder="Source title"
                            required
                        >

                    </div>


                    <!-- SOURCE TYPE -->

                    <div class="form-group">

                        <label for="source-type">
                            Source Type
                        </label>

                        <select
                            id="source-type"
                            required
                        >

                            <option value="">
                                -- Select Type --
                            </option>

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
                            URL
                        </label>

                        <input
                            type="url"
                            id="source-url"
                            placeholder="https://..."
                        >

                    </div>


                    <!-- PEOPLE -->

                    <div class="form-group form-group-full">

                        <label for="source-people">
                            People Associated With Source
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


                </div>


                <div class="form-actions">

                    <button
                        type="submit"
                        id="add-source"
                        class="primary-button"
                    >
                        Add Source
                    </button>

                    <button
                        type="button"
                        id="cancel-source"
                        class="secondary-button"
                    >
                        Cancel
                    </button>

                </div>


                <div
                    id="source-message"
                    class="manage-message"
                ></div>

            </form>

        </div>


        <div class="management-card">

            <div class="management-card-header">

                <h4>
                    Sources & References
                </h4>

                <p>
                    Sources currently associated with this case.
                </p>

            </div>


            <div id="source-list">

                <p class="empty-message">
                    Select a case to view sources.
                </p>

            </div>

        </div>
    `;


    /*
       Populate source types.
    */

    const typeSelect =
        document.getElementById(
            "source-type"
        );


    if (typeSelect) {

        SOURCE_TYPES.forEach(type => {

            const option =
                document.createElement("option");

            option.value = type;
            option.textContent = type;

            typeSelect.appendChild(
                option
            );

        });

    }


    /*
       Submit handler.
    */

    const form =
        document.getElementById(
            "source-form"
        );


    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await saveSource();

            }
        );

    }


    /*
       Cancel handler.
    */

    const cancelButton =
        document.getElementById(
            "cancel-source"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                cancelSourceEdit();

            }
        );

    }

}


/* -----------------------------------------
   LOAD PEOPLE SELECTOR
   ----------------------------------------- */

async function loadSourcePeople(caseId) {

    const peopleSelect =
        document.getElementById(
            "source-people"
        );


    if (!peopleSelect) {
        return;
    }


    peopleSelect.innerHTML = "";


    if (!caseId) {
        return;
    }


    const numericCaseId =
        Number(caseId);


    if (!Number.isFinite(numericCaseId)) {
        return;
    }


    try {

        /*
           Find people assigned to this case.
        */

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

            console.error(
                "CBRA: Error loading case people:",
                casePeopleError
            );

            return;
        }


        if (
            !casePeople ||
            casePeople.length === 0
        ) {

            const option =
                document.createElement("option");

            option.disabled = true;
            option.textContent =
                "No people assigned to this case";

            peopleSelect.appendChild(
                option
            );

            return;
        }


        const personIds = [
            ...new Set(
                casePeople
                    .map(row => row.person_id)
                    .filter(Boolean)
            )
        ];


        if (personIds.length === 0) {
            return;
        }


        /*
           Get the actual people.
        */

        const {
            data: people,
            error: peopleError
        } = await sourcesSupabase
            .from("people")
            .select(
                "id, display_name"
            )
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
                "CBRA: Error loading people:",
                peopleError
            );

            return;
        }


        (people || []).forEach(
            person => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    person.id;

                option.textContent =
                    person.display_name ||
                    "Unnamed Person";

                peopleSelect.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "CBRA: Unexpected error loading source people:",
            error
        );

    }

}


/* -----------------------------------------
   LOAD SOURCES
   ----------------------------------------- */

async function loadManageSources(caseId) {

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


    /*
       Build the interface if it hasn't
       been created yet.
    */

    if (
        !document.getElementById(
            "source-form"
        )
    ) {

        buildSourcesManagementUI();

    }


    const sourceList =
        document.getElementById(
            "source-list"
        );


    if (!sourceList) {
        return;
    }


    sourceList.innerHTML = "";


    if (!caseId) {

        sourceList.innerHTML = `
            <p class="empty-message">
                Select a case to view sources.
            </p>
        `;

        return;
    }


    const numericCaseId =
        Number(caseId);


    if (!Number.isFinite(numericCaseId)) {

        sourceList.innerHTML = `
            <p class="empty-message">
                Invalid case selected.
            </p>
        `;

        return;
    }


    /*
       Load people for the selector.
    */

    await loadSourcePeople(
        numericCaseId
    );


    try {

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

            console.error(
                "CBRA: Error loading sources:",
                error
            );

            sourceList.innerHTML = `
                <p class="empty-message">
                    Could not load sources.
                </p>
            `;

            return;
        }


        if (
            !sources ||
            sources.length === 0
        ) {

            sourceList.innerHTML = `
                <p class="empty-message">
                    No sources have been added to this case yet.
                </p>
            `;

            return;
        }


        for (const source of sources) {

            await renderSourceCard(
                source,
                sourceList
            );

        }


    } catch (error) {

        console.error(
            "CBRA: Unexpected error loading sources:",
            error
        );

        sourceList.innerHTML = `
            <p class="empty-message">
                Could not load sources.
            </p>
        `;

    }

}


/* -----------------------------------------
   RENDER SOURCE CARD
   ----------------------------------------- */

async function renderSourceCard(
    source,
    sourceList
) {

    const card =
        document.createElement("div");

    card.className =
        "management-card";


    /*
       Title
    */

    const title =
        document.createElement("h4");

    title.textContent =
        source.title ||
        "Untitled Source";


    /*
       Source type
    */

    const type =
        document.createElement("p");

    type.innerHTML =
        `<strong>Type:</strong> ${escapeHtml(
            source.source_type ||
            "Unknown"
        )}`;


    /*
       Publication date
    */

    const date =
        document.createElement("p");


    if (source.publication_date) {

        date.innerHTML =
            `<strong>Publication Date:</strong> ${escapeHtml(
                source.publication_date
            )}`;

    }


    /*
       URL
    */

    const url =
        document.createElement("p");


    if (source.url) {

        const link =
            document.createElement("a");

        link.href =
            source.url;

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

        link.textContent =
            source.url;

        url.appendChild(
            link
        );

    }


    /*
       People
    */

    const peopleSection =
        document.createElement("div");

    peopleSection.className =
        "source-people-section";


    const peopleHeading =
        document.createElement("p");

    peopleHeading.innerHTML =
        "<strong>People:</strong>";


    const peopleList =
        document.createElement("div");

    peopleList.className =
        "source-people-list";


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
            !sourcePeopleError &&
            sourcePeople &&
            sourcePeople.length > 0
        ) {

            const personIds =
                sourcePeople
                    .map(row => row.person_id)
                    .filter(Boolean);


            if (personIds.length > 0) {

                const {
                    data: people,
                    error: peopleError
                } = await sourcesSupabase
                    .from("people")
                    .select(
                        "id, display_name"
                    )
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


                if (
                    !peopleError &&
                    people
                ) {

                    people.forEach(
                        person => {

                            const personItem =
                                document.createElement(
                                    "span"
                                );

                            personItem.textContent =
                                person.display_name ||
                                "Unnamed Person";

                            peopleList.appendChild(
                                personItem
                            );

                        }
                    );

                }

            }

        }


    } catch (error) {

        console.error(
            "CBRA: Error loading source people:",
            error
        );

    }


    if (
        peopleList.children.length === 0
    ) {

        const none =
            document.createElement(
                "span"
            );

        none.textContent =
            "No people linked";

        peopleList.appendChild(
            none
        );

    }


    peopleSection.appendChild(
        peopleHeading
    );

    peopleSection.appendChild(
        peopleList
    );


    /*
       Buttons
    */

    const actions =
        document.createElement("div");

    actions.className =
        "form-actions";


    const editButton =
        document.createElement("button");

    editButton.type =
        "button";

    editButton.className =
        "secondary-button";

    editButton.textContent =
        "Edit";


    editButton.addEventListener(
        "click",
        function () {

            editSource(
                source
            );

        }
    );


    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.className =
        "secondary-button";

    deleteButton.textContent =
        "Delete";


    deleteButton.addEventListener(
        "click",
        function () {

            removeSource(
                source.id
            );

        }
    );


    actions.appendChild(
        editButton
    );

    actions.appendChild(
        deleteButton
    );


    /*
       Build card.
    */

    card.appendChild(
        title
    );

    card.appendChild(
        type
    );


    if (source.publication_date) {

        card.appendChild(
            date
        );

    }


    if (source.url) {

        card.appendChild(
            url
        );

    }


    card.appendChild(
        peopleSection
    );

    card.appendChild(
        actions
    );


    sourceList.appendChild(
        card
    );

}


/* -----------------------------------------
   SAVE SOURCE
   ----------------------------------------- */

async function saveSource() {

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

    const peopleInput =
        document.getElementById(
            "source-people"
        );


    const caseId =
        getSourcesCaseId();


    if (!caseId) {

        showSourceMessage(
            "No case selected.",
            true
        );

        return;
    }


    const title =
        titleInput
            ? titleInput.value.trim()
            : "";


    const source_type =
        typeInput
            ? typeInput.value.trim()
            : "";


    const publication_date =
        dateInput &&
        dateInput.value
            ? dateInput.value
            : null;


    const url =
        urlInput
            ? urlInput.value.trim()
            : "";


    if (!title) {

        showSourceMessage(
            "Please enter a source title.",
            true
        );

        return;
    }


    if (!source_type) {

        showSourceMessage(
            "Please select a source type.",
            true
        );

        return;
    }


    const selectedPeople =
        peopleInput
            ? Array.from(
                peopleInput.selectedOptions
            ).map(
                option => option.value
            )
            : [];


    try {

        let sourceId;


        /* -----------------------------------------
           UPDATE
           ----------------------------------------- */

        if (editingSourceId) {

            const {
                data,
                error
            } = await sourcesSupabase
                .from("sources")
                .update({
                    title,
                    source_type,
                    publication_date,
                    url
                })
                .eq(
                    "id",
                    editingSourceId
                )
                .select()
                .single();


            if (error) {

                console.error(
                    "CBRA: Error updating source:",
                    error
                );

                showSourceMessage(
                    "Could not update source.",
                    true
                );

                return;
            }


            sourceId =
                data.id;

        }


        /* -----------------------------------------
           INSERT
           ----------------------------------------- */

        else {

            const numericCaseId =
                Number(caseId);


            const {
                data,
                error
            } = await sourcesSupabase
                .from("sources")
                .insert({
                    title,
                    source_type,
                    publication_date,
                    url,
                    case_id: numericCaseId
                })
                .select()
                .single();


            if (error) {

                console.error(
                    "CBRA: Error creating source:",
                    error
                );

                showSourceMessage(
                    "Could not add source.",
                    true
                );

                return;
            }


            sourceId =
                data.id;

        }


        /* -----------------------------------------
           REMOVE OLD PEOPLE LINKS
           ----------------------------------------- */

        const {
            error: deleteError
        } = await sourcesSupabase
            .from("source_people")
            .delete()
            .eq(
                "source_id",
                sourceId
            );


        if (deleteError) {

            console.error(
                "CBRA: Error removing old source people:",
                deleteError
            );

        }


        /* -----------------------------------------
           INSERT PEOPLE LINKS
           ----------------------------------------- */

        if (
            selectedPeople.length > 0
        ) {

            const peopleRows =
                selectedPeople.map(
                    personId => ({
                        source_id:
                            sourceId,

                        person_id:
                            personId
                    })
                );


            const {
                error: peopleError
            } = await sourcesSupabase
                .from("source_people")
                .insert(
                    peopleRows
                );


            if (peopleError) {

                console.error(
                    "CBRA: Error linking people:",
                    peopleError
                );

                showSourceMessage(
                    "Source saved, but people could not be linked.",
                    true
                );

            }

        }


        /*
           Reset.
        */

        editingSourceId =
            null;


        resetSourceForm();


        showSourceMessage(
            "Source saved successfully.",
            false
        );


        await loadManageSources(
            caseId
        );


        /*
           Refresh source selectors
           elsewhere on Manage.
        */

        if (
            typeof window.loadCrimeScenePhotoSources ===
            "function"
        ) {

            window.loadCrimeScenePhotoSources(
                caseId
            );

        }


        if (
            typeof window.loadGeneralMediaSources ===
            "function"
        ) {

            window.loadGeneralMediaSources(
                caseId
            );

        }


    } catch (error) {

        console.error(
            "CBRA: Unexpected error saving source:",
            error
        );

        showSourceMessage(
            "An unexpected error occurred.",
            true
        );

    }

}


/* -----------------------------------------
   EDIT SOURCE
   ----------------------------------------- */

async function editSource(
    source
) {

    editingSourceId =
        source.id;


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

    const peopleInput =
        document.getElementById(
            "source-people"
        );

    const submitButton =
        document.getElementById(
            "add-source"
        );


    if (titleInput) {

        titleInput.value =
            source.title || "";

    }


    if (typeInput) {

        const normalized =
            normalizeSourceType(
                source.source_type
            );


        /*
           If the database contains an older
           source type, preserve it rather than
           changing the stored value.
        */

        const existingOption =
            Array.from(
                typeInput.options
            ).find(
                option =>
                    option.value ===
                    normalized
            );


        if (
            !existingOption &&
            source.source_type
        ) {

            const legacyOption =
                document.createElement(
                    "option"
                );

            legacyOption.value =
                source.source_type;

            legacyOption.textContent =
                source.source_type;

            typeInput.appendChild(
                legacyOption
            );

        }


        typeInput.value =
            normalized;

    }


    if (dateInput) {

        dateInput.value =
            source.publication_date ||
            "";

    }


    if (urlInput) {

        urlInput.value =
            source.url ||
            "";

    }


    /*
       Clear people first.
    */

    if (peopleInput) {

        Array.from(
            peopleInput.options
        ).forEach(
            option => {
                option.selected =
                    false;
            }
        );


        try {

            const {
                data,
                error
            } = await sourcesSupabase
                .from("source_people")
                .select(
                    "person_id"
                )
                .eq(
                    "source_id",
                    source.id
                );


            if (
                !error &&
                data
            ) {

                const selectedIds =
                    data.map(
                        row =>
                            String(
                                row.person_id
                            )
                    );


                Array.from(
                    peopleInput.options
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

        } catch (error) {

            console.error(
                "CBRA: Error loading source people for edit:",
                error
            );

        }

    }


    if (submitButton) {

        submitButton.textContent =
            "Update Source";

    }


    showSourceMessage(
        "Editing source...",
        false
    );

}


/* -----------------------------------------
   CANCEL EDIT
   ----------------------------------------- */

function cancelSourceEdit() {

    editingSourceId =
        null;


    resetSourceForm();


    showSourceMessage(
        "",
        false
    );

}


/* -----------------------------------------
   RESET FORM
   ----------------------------------------- */

function resetSourceForm() {

    const form =
        document.getElementById(
            "source-form"
        );


    if (form) {

        form.reset();

    }


    const peopleInput =
        document.getElementById(
            "source-people"
        );


    if (peopleInput) {

        Array.from(
            peopleInput.options
        ).forEach(
            option => {

                option.selected =
                    false;

            }
        );

    }


    const submitButton =
        document.getElementById(
            "add-source"
        );


    if (submitButton) {

        submitButton.textContent =
            "Add Source";

    }


    editingSourceId =
        null;

}


/* -----------------------------------------
   DELETE SOURCE
   ----------------------------------------- */

async function removeSource(
    sourceId
) {

    if (!sourceId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Delete this source?"
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
           Remove people relationships first.
        */

        const {
            error: peopleError
        } = await sourcesSupabase
            .from("source_people")
            .delete()
            .eq(
                "source_id",
                sourceId
            );


        if (peopleError) {

            console.error(
                "CBRA: Error deleting source people:",
                peopleError
            );

        }


        /*
           Delete source.
        */

        const {
            error
        } = await sourcesSupabase
            .from("sources")
            .delete()
            .eq(
                "id",
                sourceId
            );


        if (error) {

            console.error(
                "CBRA: Error deleting source:",
                error
            );

            showSourceMessage(
                "Could not delete source.",
                true
            );

            return;
        }


        showSourceMessage(
            "Source deleted.",
            false
        );


        const caseId =
            getSourcesCaseId();


        await loadManageSources(
            caseId
        );


        /*
           Refresh source selectors elsewhere.
        */

        if (
            typeof window.loadCrimeScenePhotoSources ===
            "function"
        ) {

            window.loadCrimeScenePhotoSources(
                caseId
            );

        }


        if (
            typeof window.loadGeneralMediaSources ===
            "function"
        ) {

            window.loadGeneralMediaSources(
                caseId
            );

        }


    } catch (error) {

        console.error(
            "CBRA: Unexpected error deleting source:",
            error
        );

        showSourceMessage(
            "An unexpected error occurred.",
            true
        );

    }

}


/* -----------------------------------------
   MESSAGE
   ----------------------------------------- */

function showSourceMessage(
    text,
    isError = false
) {

    const message =
        document.getElementById(
            "source-message"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text || "";


    message.classList.toggle(
        "error",
        isError
    );

}


/* -----------------------------------------
   HTML ESCAPE
   ----------------------------------------- */

function escapeHtml(
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


/* -----------------------------------------
   INITIALIZE
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
           The Sources section exists in
           Manage.html, but its actual controls
           are generated here.
        */

        buildSourcesManagementUI();

    }
);


/* -----------------------------------------
   EXPORTS
   ----------------------------------------- */

window.buildSourcesManagementUI =
    buildSourcesManagementUI;

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

window.resetSourceForm =
    resetSourceForm;