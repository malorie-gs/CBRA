/* =========================================
   CBRA — MANAGE SOURCES
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const sourcesSupabase = window.supabaseClient;


/* -----------------------------------------
   SOURCE TYPES
   DO NOT CHANGE THESE
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
   CURRENT EDIT STATE
   ----------------------------------------- */

let editingSourceId = null;


/* -----------------------------------------
   GET CURRENT CASE
   ----------------------------------------- */

function getSourcesCaseId() {

    if (typeof window.getCurrentCaseId === "function") {
        return window.getCurrentCaseId();
    }

    const params = new URLSearchParams(window.location.search);

    return params.get("id") || params.get("case_id");
}


/* -----------------------------------------
   NORMALIZE SOURCE TYPE
   ----------------------------------------- */

function normalizeSourceType(value) {

    if (!value) {
        return "";
    }

    const match = SOURCE_TYPES.find(
        type => type.toLowerCase() === String(value).toLowerCase()
    );

    return match || value;
}


/* -----------------------------------------
   INITIALIZE SOURCE FORM
   ----------------------------------------- */

function initializeSourcesUI() {

    const form = document.getElementById("source-form");
    const typeSelect = document.getElementById("source-type");

    if (!form) {
        console.error("CBRA: #source-form not found.");
        return;
    }

    if (!typeSelect) {
        console.error("CBRA: #source-type not found.");
        return;
    }

    /*
       Populate the existing source-type dropdown.

       This intentionally uses the existing HTML form
       instead of creating a new #sources-management section.
    */

    typeSelect.innerHTML = "";

    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "-- Select Type --";

    typeSelect.appendChild(placeholder);

    SOURCE_TYPES.forEach(type => {

        const option = document.createElement("option");

        option.value = type;
        option.textContent = type;

        typeSelect.appendChild(option);

    });


    /*
       Prevent duplicate initialization.
    */

    if (form.dataset.cbraInitialized === "true") {
        return;
    }

    form.dataset.cbraInitialized = "true";


    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        await saveSource();

    });


    const cancelButton =
        document.getElementById("cancel-source");

    if (cancelButton) {

        cancelButton.addEventListener("click", function (event) {

            event.preventDefault();

            cancelSourceEdit();

        });

    }

}


/* -----------------------------------------
   LOAD PEOPLE AVAILABLE FOR SOURCES
   ----------------------------------------- */

async function loadSourcePeople(caseId) {

    const peopleSelect =
        document.getElementById("source-people");

    if (!peopleSelect) {
        console.error("CBRA: #source-people not found.");
        return;
    }

    peopleSelect.innerHTML = "";

    if (!caseId) {
        return;
    }

    try {

        const numericCaseId = Number(caseId);

        if (!Number.isFinite(numericCaseId)) {
            console.error(
                "CBRA: Invalid case ID:",
                caseId
            );
            return;
        }


        /*
           First get the people connected to this case.
        */

        const {
            data: casePeople,
            error: casePeopleError
        } = await sourcesSupabase
            .from("case_people")
            .select("person_id")
            .eq("case_id", numericCaseId);


        if (casePeopleError) {
            console.error(
                "CBRA: Error loading case people:",
                casePeopleError
            );
            return;
        }


        if (!casePeople || casePeople.length === 0) {

            const option = document.createElement("option");

            option.disabled = true;
            option.textContent = "No people assigned to this case";

            peopleSelect.appendChild(option);

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
           Load the actual people records.
        */

        const {
            data: people,
            error: peopleError
        } = await sourcesSupabase
            .from("people")
            .select("id, display_name")
            .in("id", personIds)
            .order("display_name", {
                ascending: true
            });


        if (peopleError) {
            console.error(
                "CBRA: Error loading people:",
                peopleError
            );
            return;
        }


        (people || []).forEach(person => {

            const option = document.createElement("option");

            option.value = person.id;
            option.textContent =
                person.display_name || "Unnamed Person";

            peopleSelect.appendChild(option);

        });

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

    const list =
        document.getElementById("source-list");

    if (!list) {
        console.error("CBRA: #source-list not found.");
        return;
    }

    list.innerHTML = "";

    if (!caseId) {

        list.innerHTML =
            "<p>No case selected.</p>";

        return;
    }


    const numericCaseId = Number(caseId);

    if (!Number.isFinite(numericCaseId)) {

        list.innerHTML =
            "<p>Invalid case ID.</p>";

        return;
    }


    /*
       Make sure the people selector is populated.
    */

    await loadSourcePeople(numericCaseId);


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
            .eq("case_id", numericCaseId)
            .order("publication_date", {
                ascending: false,
                nullsFirst: false
            });


        if (error) {

            console.error(
                "CBRA: Error loading sources:",
                error
            );

            list.innerHTML =
                "<p>Could not load sources.</p>";

            return;
        }


        if (!sources || sources.length === 0) {

            list.innerHTML =
                "<p>No sources have been added to this case yet.</p>";

            return;
        }


        for (const source of sources) {

            await renderSourceCard(source, list);

        }

    } catch (error) {

        console.error(
            "CBRA: Unexpected error loading sources:",
            error
        );

        list.innerHTML =
            "<p>Could not load sources.</p>";

    }

}


/* -----------------------------------------
   RENDER SOURCE CARD
   ----------------------------------------- */

async function renderSourceCard(source, list) {

    const card =
        document.createElement("div");

    card.className = "source-card";


    const title =
        document.createElement("h3");

    title.textContent =
        source.title || "Untitled Source";


    const type =
        document.createElement("p");

    type.innerHTML =
        `<strong>Type:</strong> ${escapeHtml(
            source.source_type || "Unknown"
        )}`;


    const date =
        document.createElement("p");

    if (source.publication_date) {

        date.innerHTML =
            `<strong>Publication Date:</strong> ${escapeHtml(
                source.publication_date
            )}`;

    }


    const url =
        document.createElement("p");

    if (source.url) {

        const link =
            document.createElement("a");

        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.url;

        url.appendChild(link);

    }


    /*
       Load people connected to this source.
    */

    const peopleContainer =
        document.createElement("div");

    peopleContainer.className =
        "source-people";


    const peopleHeading =
        document.createElement("strong");

    peopleHeading.textContent =
        "People:";

    peopleContainer.appendChild(
        peopleHeading
    );


    const peopleList =
        document.createElement("div");

    peopleList.className =
        "source-people-list";


    try {

        const {
            data: sourcePeople,
            error
        } = await sourcesSupabase
            .from("source_people")
            .select("person_id")
            .eq("source_id", source.id);


        if (!error &&
            sourcePeople &&
            sourcePeople.length > 0) {

            const personIds = sourcePeople
                .map(row => row.person_id)
                .filter(Boolean);


            if (personIds.length > 0) {

                const {
                    data: people,
                    error: peopleError
                } = await sourcesSupabase
                    .from("people")
                    .select("id, display_name")
                    .in("id", personIds)
                    .order("display_name", {
                        ascending: true
                    });


                if (!peopleError && people) {

                    people.forEach(person => {

                        const personItem =
                            document.createElement("span");

                        personItem.className =
                            "source-person";

                        personItem.textContent =
                            person.display_name ||
                            "Unnamed Person";

                        peopleList.appendChild(
                            personItem
                        );

                    });

                }

            }

        }

    } catch (error) {

        console.error(
            "CBRA: Error loading source people:",
            error
        );

    }


    if (!peopleList.children.length) {

        const none =
            document.createElement("span");

        none.textContent =
            "No people linked";

        peopleList.appendChild(none);

    }


    peopleContainer.appendChild(
        peopleList
    );


    /*
       Buttons
    */

    const actions =
        document.createElement("div");

    actions.className =
        "source-actions";


    const editButton =
        document.createElement("button");

    editButton.type = "button";
    editButton.textContent = "Edit";

    editButton.addEventListener(
        "click",
        function () {
            editSource(source);
        }
    );


    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener(
        "click",
        function () {
            removeSource(source.id);
        }
    );


    actions.appendChild(editButton);
    actions.appendChild(deleteButton);


    card.appendChild(title);
    card.appendChild(type);

    if (source.publication_date) {
        card.appendChild(date);
    }

    if (source.url) {
        card.appendChild(url);
    }

    card.appendChild(peopleContainer);
    card.appendChild(actions);

    list.appendChild(card);

}


/* -----------------------------------------
   SAVE SOURCE
   ----------------------------------------- */

async function saveSource() {

    const titleInput =
        document.getElementById("source-title");

    const typeInput =
        document.getElementById("source-type");

    const dateInput =
        document.getElementById("source-date");

    const urlInput =
        document.getElementById("source-url");

    const peopleInput =
        document.getElementById("source-people");

    const message =
        document.getElementById("source-message");


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
        dateInput
            ? dateInput.value || null
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
            ).map(option => option.value)
            : [];


    try {

        let sourceId;


        /* -----------------------------------------
           UPDATE EXISTING SOURCE
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
                .eq("id", editingSourceId)
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


            sourceId = data.id;

        }


        /* -----------------------------------------
           CREATE NEW SOURCE
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


            sourceId = data.id;

        }


        /* -----------------------------------------
           REMOVE OLD PEOPLE LINKS
           ----------------------------------------- */

        const {
            error: deletePeopleError
        } = await sourcesSupabase
            .from("source_people")
            .delete()
            .eq("source_id", sourceId);


        if (deletePeopleError) {

            console.error(
                "CBRA: Error removing old source people:",
                deletePeopleError
            );

        }


        /* -----------------------------------------
           ADD PEOPLE LINKS
           ----------------------------------------- */

        if (selectedPeople.length > 0) {

            const peopleRows =
                selectedPeople.map(personId => ({
                    source_id: sourceId,
                    person_id: personId
                }));


            const {
                error: peopleInsertError
            } = await sourcesSupabase
                .from("source_people")
                .insert(peopleRows);


            if (peopleInsertError) {

                console.error(
                    "CBRA: Error linking people to source:",
                    peopleInsertError
                );

                showSourceMessage(
                    "Source saved, but some people could not be linked.",
                    true
                );

            }

        }


        /* -----------------------------------------
           FINISH
           ----------------------------------------- */

        editingSourceId = null;

        resetSourceForm();

        showSourceMessage(
            "Source saved successfully.",
            false
        );


        await loadManageSources(caseId);


        /*
           Also refresh the source selectors used
           by other CBRA management sections.
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

async function editSource(source) {

    editingSourceId =
        source.id;


    const titleInput =
        document.getElementById("source-title");

    const typeInput =
        document.getElementById("source-type");

    const dateInput =
        document.getElementById("source-date");

    const urlInput =
        document.getElementById("source-url");

    const peopleInput =
        document.getElementById("source-people");

    const submitButton =
        document.getElementById("add-source");


    if (titleInput) {
        titleInput.value =
            source.title || "";
    }


    if (typeInput) {

        /*
           Preserve old/legacy source types instead
           of silently changing the database value.
        */

        const normalized =
            normalizeSourceType(
                source.source_type
            );


        const existingOption =
            Array.from(
                typeInput.options
            ).find(
                option =>
                    option.value ===
                    normalized
            );


        if (!existingOption &&
            source.source_type) {

            const legacyOption =
                document.createElement("option");

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
            source.publication_date || "";

    }


    if (urlInput) {

        urlInput.value =
            source.url || "";

    }


    /*
       Load currently linked people.
    */

    if (peopleInput) {

        Array.from(
            peopleInput.options
        ).forEach(option => {

            option.selected = false;

        });


        try {

            const {
                data,
                error
            } = await sourcesSupabase
                .from("source_people")
                .select("person_id")
                .eq("source_id", source.id);


            if (!error && data) {

                const selectedIds =
                    data.map(
                        row => String(row.person_id)
                    );


                Array.from(
                    peopleInput.options
                ).forEach(option => {

                    option.selected =
                        selectedIds.includes(
                            String(option.value)
                        );

                });

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
   CANCEL SOURCE EDIT
   ----------------------------------------- */

function cancelSourceEdit() {

    editingSourceId = null;

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
        document.getElementById("source-form");


    if (form) {
        form.reset();
    }


    const peopleInput =
        document.getElementById("source-people");


    if (peopleInput) {

        Array.from(
            peopleInput.options
        ).forEach(option => {

            option.selected = false;

        });

    }


    const submitButton =
        document.getElementById("add-source");


    if (submitButton) {

        submitButton.textContent =
            "Add Source";

    }


    editingSourceId = null;

}


/* -----------------------------------------
   DELETE SOURCE
   ----------------------------------------- */

async function removeSource(sourceId) {

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
           Delete people relationships first.
        */

        const {
            error: peopleError
        } = await sourcesSupabase
            .from("source_people")
            .delete()
            .eq("source_id", sourceId);


        if (peopleError) {

            console.error(
                "CBRA: Error deleting source people:",
                peopleError
            );

        }


        /*
           Delete the source itself.
        */

        const {
            error
        } = await sourcesSupabase
            .from("sources")
            .delete()
            .eq("id", sourceId);


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
           Refresh other source selectors.
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
        document.getElementById("source-message");


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

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

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
   DOM READY
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        initializeSourcesUI();

        const caseId =
            getSourcesCaseId();


        if (caseId) {

            await loadManageSources(
                caseId
            );

        }

    }
);


/* -----------------------------------------
   EXPORTS
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

window.resetSourceForm =
    resetSourceForm;