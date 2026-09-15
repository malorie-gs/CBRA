/* =========================================
   CBRA — MANAGE SOURCES
   CENTRAL SOURCE SYSTEM
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const sourcesSupabase =
    window.supabaseClient;


/* -----------------------------------------
   BUILD SOURCE PEOPLE CHECKBOXES
   ----------------------------------------- */

async function loadSourcePeople() {

    const peopleContainer =
        document.getElementById(
            "source-people"
        );

    if (!peopleContainer) {
        return;
    }

    peopleContainer.innerHTML =
        "<p>Loading people...</p>";

    const {
        data,
        error
    } =
        await sourcesSupabase
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
            "Error loading source people:",
            error
        );

        peopleContainer.innerHTML =
            "<p>Unable to load people.</p>";

        return;
    }

    if (
        !data ||
        data.length === 0
    ) {

        peopleContainer.innerHTML =
            "<p>No people available.</p>";

        return;
    }

    peopleContainer.innerHTML = "";

    data.forEach(
        function(person) {

            const wrapper =
                document.createElement(
                    "label"
                );

            wrapper.className =
                "source-person-checkbox";

            wrapper.style.display =
                "block";

            wrapper.style.marginBottom =
                "8px";

            wrapper.style.cursor =
                "pointer";

            const checkbox =
                document.createElement(
                    "input"
                );

            checkbox.type =
                "checkbox";

            checkbox.className =
                "source-person-option";

            checkbox.value =
                String(
                    person.id
                );

            checkbox.style.marginRight =
                "8px";

            const name =
                document.createTextNode(
                    person.display_name ||
                    "Unnamed Person"
                );

            wrapper.appendChild(
                checkbox
            );

            wrapper.appendChild(
                name
            );

            peopleContainer.appendChild(
                wrapper
            );

        }
    );

}


/* -----------------------------------------
   BUILD SOURCE CASE SELECTOR
   ----------------------------------------- */

async function loadSourceCases() {

    const casesSelect =
        document.getElementById(
            "source-cases"
        );

    if (!casesSelect) {
        return;
    }

    casesSelect.innerHTML = "";

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
                "case_name",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Error loading source cases:",
            error
        );

        casesSelect.innerHTML = `
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

        casesSelect.innerHTML = `
            <option disabled>
                No cases available
            </option>
        `;

        return;
    }

    data.forEach(
        function(caseRecord) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(
                    caseRecord.id
                );

            option.textContent =
                caseRecord.case_name ||
                "Unnamed Case";

            option.selected =
                false;

            casesSelect.appendChild(
                option
            );

        }
    );

}


/* -----------------------------------------
   GET SELECTED CASES
   ----------------------------------------- */

function getSelectedSourceCases() {

    const casesElement =
        document.getElementById(
            "source-cases"
        );

    const selectedCases = [];

    if (!casesElement) {
        return selectedCases;
    }

    Array.from(
        casesElement.selectedOptions
    ).forEach(
        function(option) {

            const caseId =
                Number(
                    option.value
                );

            if (
                Number.isInteger(caseId) &&
                caseId > 0
            ) {

                selectedCases.push(
                    caseId
                );

            }

        }
    );

    return selectedCases;

}


/* -----------------------------------------
   GET SELECTED PEOPLE
   ----------------------------------------- */

function getSelectedSourcePeople() {

    const peopleContainer =
        document.getElementById(
            "source-people"
        );

    const selectedPeople = [];

    if (!peopleContainer) {
        return selectedPeople;
    }

    const checkedPeople =
        peopleContainer.querySelectorAll(
            'input[type="checkbox"]:checked'
        );

    checkedPeople.forEach(
        function(checkbox) {

            const personId =
                Number(
                    checkbox.value
                );

            if (
                Number.isInteger(personId) &&
                personId > 0
            ) {

                selectedPeople.push(
                    personId
                );

            }

        }
    );

    return selectedPeople;

}


/* -----------------------------------------
   LOAD SOURCES FOR CURRENT CASE
   ----------------------------------------- */

async function loadSources(caseId) {

    const list =
        document.getElementById(
            "source-list"
        );

    if (!list) {

        console.warn(
            "Element not found: source-list"
        );

        return;
    }

    if (!caseId) {

        list.innerHTML =
            '<p class="empty-message">Select a case to view its sources.</p>';

        return;
    }

    list.innerHTML =
        '<p class="empty-message">Loading sources...</p>';

    try {

        const {
            data,
            error
        } =
            await sourcesSupabase
                .from("source_cases")
                .select(`
                    id,
                    source_id,
                    source:sources (
                        id,
                        title,
                        url,
                        source_type,
                        publication_date
                    )
                `)
                .eq(
                    "case_id",
                    Number(caseId)
                );

        if (error) {
            throw error;
        }

        const sources =
            (data || [])
                .map(
                    function(connection) {

                        return connection.source;

                    }
                )
                .filter(
                    function(source) {

                        return Boolean(
                            source
                        );

                    }
                )
                .sort(
                    function(a, b) {

                        const dateA =
                            a.publication_date || "";

                        const dateB =
                            b.publication_date || "";

                        return dateB.localeCompare(
                            dateA
                        );

                    }
                );

        list.innerHTML = "";

        if (
            sources.length === 0
        ) {

            list.innerHTML =
                '<p class="empty-message">No sources added yet.</p>';

            return;
        }

        sources.forEach(
            function(source) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "manage-record";


                /* -----------------------------------------
                   TITLE
                   ----------------------------------------- */

                const title =
                    document.createElement(
                        "strong"
                    );

                title.textContent =
                    source.title ||
                    "Untitled Source";

                card.appendChild(
                    title
                );


                /* -----------------------------------------
                   SOURCE TYPE
                   ----------------------------------------- */

                if (source.source_type) {

                    const type =
                        document.createElement(
                            "p"
                        );

                    type.textContent =
                        "Type: " +
                        source.source_type;

                    card.appendChild(
                        type
                    );

                }


                /* -----------------------------------------
                   PUBLICATION DATE
                   ----------------------------------------- */

                if (
                    source.publication_date
                ) {

                    const date =
                        document.createElement(
                            "p"
                        );

                    date.textContent =
                        "Publication date: " +
                        source.publication_date;

                    card.appendChild(
                        date
                    );

                }


                /* -----------------------------------------
                   SOURCE LINK
                   ----------------------------------------- */

                if (source.url) {

                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href =
                        source.url;

                    link.textContent =
                        "Open Source";

                    link.target =
                        "_blank";

                    link.rel =
                        "noopener noreferrer";

                    link.style.display =
                        "inline-block";

                    link.style.marginTop =
                        "6px";

                    card.appendChild(
                        link
                    );

                }


                /* -----------------------------------------
                   BUTTON CONTAINER
                   ----------------------------------------- */

                const buttonContainer =
                    document.createElement(
                        "div"
                    );

                buttonContainer.style.marginTop =
                    "10px";


                /* -----------------------------------------
                   EDIT BUTTON
                   ----------------------------------------- */

                const edit =
                    document.createElement(
                        "button"
                    );

                edit.type =
                    "button";

                edit.textContent =
                    "Edit";

                edit.className =
                    "secondary-button";

                edit.style.marginRight =
                    "8px";

                edit.onclick =
                    function() {

                        editSource(
                            source.id
                        );

                    };

                buttonContainer.appendChild(
                    edit
                );


                /* -----------------------------------------
                   REMOVE BUTTON
                   ----------------------------------------- */

                const remove =
                    document.createElement(
                        "button"
                    );

                remove.type =
                    "button";

                remove.textContent =
                    "Remove";

                remove.className =
                    "secondary-button";

                remove.onclick =
                    function() {

                        removeSource(
                            source.id
                        );

                    };

                buttonContainer.appendChild(
                    remove
                );


                card.appendChild(
                    buttonContainer
                );

                list.appendChild(
                    card
                );

            }
        );

    } catch (error) {

        console.error(
            "Source loading error:",
            error
        );

        list.innerHTML =
            '<p class="form-message">Unable to load sources.</p>';

    }

}


/* -----------------------------------------
   EDIT SOURCE
   ----------------------------------------- */

async function editSource(sourceId) {

    if (!sourceId) {
        return;
    }


    try {

        /* -----------------------------------------
           LOAD SOURCE
           ----------------------------------------- */

        const {
            data: source,
            error: sourceError
        } =
            await sourcesSupabase
                .from("sources")
                .select(`
                    id,
                    title,
                    url,
                    source_type,
                    publication_date
                `)
                .eq(
                    "id",
                    sourceId
                )
                .single();

        if (sourceError) {
            throw sourceError;
        }


        /* -----------------------------------------
           LOAD ASSOCIATED CASES
           ----------------------------------------- */

        const {
            data: caseConnections,
            error: caseError
        } =
            await sourcesSupabase
                .from("source_cases")
                .select(
                    "case_id"
                )
                .eq(
                    "source_id",
                    sourceId
                );

        if (caseError) {
            throw caseError;
        }


        /* -----------------------------------------
           LOAD ASSOCIATED PEOPLE
           ----------------------------------------- */

        const {
            data: peopleConnections,
            error: peopleError
        } =
            await sourcesSupabase
                .from("source_people")
                .select(
                    "person_id"
                )
                .eq(
                    "source_id",
                    sourceId
                );

        if (peopleError) {
            throw peopleError;
        }


        /* -----------------------------------------
           FORM ELEMENTS
           ----------------------------------------- */

        const titleElement =
            document.getElementById(
                "source-title"
            );

        const typeElement =
            document.getElementById(
                "source-type"
            );

        const dateElement =
            document.getElementById(
                "source-date"
            );

        const urlElement =
            document.getElementById(
                "source-url"
            );

        const casesElement =
            document.getElementById(
                "source-cases"
            );

        const peopleContainer =
            document.getElementById(
                "source-people"
            );


        if (
            !titleElement ||
            !typeElement ||
            !urlElement ||
            !casesElement ||
            !peopleContainer
        ) {

            alert(
                "The source form could not be found."
            );

            return;
        }


        /* -----------------------------------------
           FILL SOURCE INFORMATION
           ----------------------------------------- */

        titleElement.value =
            source.title ||
            "";

        typeElement.value =
            source.source_type ||
            "";

        urlElement.value =
            source.url ||
            "";

        if (dateElement) {

            dateElement.value =
                source.publication_date ||
                "";

        }


        /* -----------------------------------------
           SELECT ASSOCIATED CASES
           ----------------------------------------- */

        const selectedCaseIds =
            (caseConnections || [])
                .map(
                    function(connection) {

                        return Number(
                            connection.case_id
                        );

                    }
                );

        Array.from(
            casesElement.options
        ).forEach(
            function(option) {

                option.selected =
                    selectedCaseIds.includes(
                        Number(
                            option.value
                        )
                    );

            }
        );


        /* -----------------------------------------
           CHECK ASSOCIATED PEOPLE
           ----------------------------------------- */

        const selectedPersonIds =
            (peopleConnections || [])
                .map(
                    function(connection) {

                        return Number(
                            connection.person_id
                        );

                    }
                );

        peopleContainer
            .querySelectorAll(
                'input[type="checkbox"]'
            )
            .forEach(
                function(checkbox) {

                    checkbox.checked =
                        selectedPersonIds.includes(
                            Number(
                                checkbox.value
                            )
                        );

                }
            );


        /* -----------------------------------------
           CHANGE BUTTON
           ----------------------------------------- */

        const submitButton =
            document.querySelector(
                '#source-form button[type="submit"]'
            );

        if (submitButton) {

            submitButton.textContent =
                "Save Changes";

        }


        /* -----------------------------------------
           STORE EDITING STATE
           ----------------------------------------- */

        const form =
            document.getElementById(
                "source-form"
            );

        if (form) {

            form.dataset.editingSourceId =
                String(
                    sourceId
                );

        }


        setSourceMessage(
            "Editing source. Make your changes and click Save Changes."
        );


        /* -----------------------------------------
           SCROLL TO FORM
           ----------------------------------------- */

        if (form) {

            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    } catch (error) {

        console.error(
            "Error loading source for editing:",
            error
        );

        alert(
            error.message ||
            "Unable to load source for editing."
        );

    }

}


/* -----------------------------------------
   UPDATE SOURCE
   ----------------------------------------- */

async function updateSource(sourceId) {

    const titleElement =
        document.getElementById(
            "source-title"
        );

    const typeElement =
        document.getElementById(
            "source-type"
        );

    const dateElement =
        document.getElementById(
            "source-date"
        );

    const urlElement =
        document.getElementById(
            "source-url"
        );

    const casesElement =
        document.getElementById(
            "source-cases"
        );

    const peopleContainer =
        document.getElementById(
            "source-people"
        );


    if (
        !titleElement ||
        !typeElement ||
        !urlElement
    ) {

        setSourceMessage(
            "Source form could not be found."
        );

        return;

    }


    const title =
        titleElement.value.trim();

    const sourceType =
        typeElement.value.trim();

    const url =
        urlElement.value.trim();

    const publicationDate =
        dateElement
            ? dateElement.value
            : "";


    const selectedCases =
        getSelectedSourceCases();

    const selectedPeople =
        getSelectedSourcePeople();


    /* -----------------------------------------
       VALIDATION
       ----------------------------------------- */

    if (
        !title ||
        !sourceType ||
        !url
    ) {

        setSourceMessage(
            "Please enter a title, source type, and URL."
        );

        return;

    }


    if (
        selectedCases.length === 0 &&
        selectedPeople.length === 0
    ) {

        setSourceMessage(
            "Please associate this source with at least one case or person."
        );

        return;

    }


    try {

        new URL(url);

    } catch {

        setSourceMessage(
            "Please enter a valid source URL."
        );

        return;

    }


    const button =
        document.querySelector(
            '#source-form button[type="submit"]'
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Saving...";

    }


    try {

        /* -----------------------------------------
           UPDATE CENTRAL SOURCE
           ----------------------------------------- */

        const {
            error: updateError
        } =
            await sourcesSupabase
                .from("sources")
                .update({

                    title:
                        title,

                    url:
                        url,

                    source_type:
                        sourceType,

                    publication_date:
                        publicationDate ||
                        null

                })
                .eq(
                    "id",
                    sourceId
                );


        if (updateError) {
            throw updateError;
        }


        /* -----------------------------------------
           REMOVE OLD CASE CONNECTIONS
           ----------------------------------------- */

        const {
            error: deleteCasesError
        } =
            await sourcesSupabase
                .from("source_cases")
                .delete()
                .eq(
                    "source_id",
                    sourceId
                );


        if (deleteCasesError) {
            throw deleteCasesError;
        }


        /* -----------------------------------------
           ADD NEW CASE CONNECTIONS
           ----------------------------------------- */

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
                error: insertCasesError
            } =
                await sourcesSupabase
                    .from("source_cases")
                    .insert(
                        caseRows
                    );


            if (insertCasesError) {
                throw insertCasesError;
            }

        }


        /* -----------------------------------------
           REMOVE OLD PEOPLE CONNECTIONS
           ----------------------------------------- */

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
            throw deletePeopleError;
        }


        /* -----------------------------------------
           ADD NEW PEOPLE CONNECTIONS
           ----------------------------------------- */

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
                error: insertPeopleError
            } =
                await sourcesSupabase
                    .from("source_people")
                    .insert(
                        peopleRows
                    );


            if (insertPeopleError) {
                throw insertPeopleError;
            }

        }


        /* -----------------------------------------
           RESET FORM
           ----------------------------------------- */

        const form =
            document.getElementById(
                "source-form"
            );


        if (form) {

            form.reset();

            delete form.dataset.editingSourceId;

        }


        /* Clear case selections */

        if (casesElement) {

            Array.from(
                casesElement.options
            ).forEach(
                function(option) {

                    option.selected =
                        false;

                }
            );

        }


        /* Clear people selections */

        if (peopleContainer) {

            peopleContainer
                .querySelectorAll(
                    'input[type="checkbox"]'
                )
                .forEach(
                    function(checkbox) {

                        checkbox.checked =
                            false;

                    }
                );

        }


        /* Restore button */

        if (button) {

            button.textContent =
                "Add Source";

        }


        setSourceMessage(
            "Source updated successfully."
        );


        /* -----------------------------------------
           GET CURRENT CASE
           ----------------------------------------- */

        const selector =
            document.getElementById(
                "case-selector"
            );

        const currentCaseId =
            selector
                ? selector.value
                : "";


        /* -----------------------------------------
           REFRESH SOURCES
           ----------------------------------------- */

        if (currentCaseId) {

            await loadSources(
                currentCaseId
            );

        }


        /* -----------------------------------------
           REFRESH DOCUMENT SOURCES
           ----------------------------------------- */

        if (
            typeof window.loadDocumentSources ===
            "function"
        ) {

            await window.loadDocumentSources(
                currentCaseId
            );

        }


        /* -----------------------------------------
           REFRESH CRIME SCENE PHOTO SOURCES
           ----------------------------------------- */

        if (
            typeof window.loadCrimeScenePhotoSources ===
            "function"
        ) {

            await window.loadCrimeScenePhotoSources(
                currentCaseId
            );

        }

    } catch (error) {

        console.error(
            "Error updating source:",
            error
        );

        setSourceMessage(
            error.message ||
            "Unable to update source."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            if (
                document
                    .getElementById(
                        "source-form"
                    )
                    ?.dataset
                    .editingSourceId
            ) {

                button.textContent =
                    "Save Changes";

            } else {

                button.textContent =
                    "Add Source";

            }

        }

    }

}


/* -----------------------------------------
   ADD SOURCE
   ----------------------------------------- */

async function addSource(event) {

    if (event) {

        event.preventDefault();

    }


    const form =
        document.getElementById(
            "source-form"
        );


    /* -----------------------------------------
       CHECK IF EDITING
       ----------------------------------------- */

    if (
        form &&
        form.dataset.editingSourceId
    ) {

        await updateSource(
            Number(
                form.dataset.editingSourceId
            )
        );

        return;

    }


    const selector =
        document.getElementById(
            "case-selector"
        );

    const currentCaseId =
        selector
            ? selector.value
            : "";


    const titleElement =
        document.getElementById(
            "source-title"
        );

    const typeElement =
        document.getElementById(
            "source-type"
        );

    const dateElement =
        document.getElementById(
            "source-date"
        );

    const urlElement =
        document.getElementById(
            "source-url"
        );

    const peopleContainer =
        document.getElementById(
            "source-people"
        );

    const casesElement =
        document.getElementById(
            "source-cases"
        );


    if (
        !titleElement ||
        !typeElement ||
        !urlElement
    ) {

        console.error(
            "Source form elements could not be found."
        );

        setSourceMessage(
            "Source form could not be found."
        );

        return;

    }


    const title =
        titleElement.value.trim();

    const sourceType =
        typeElement.value.trim();

    const publicationDate =
        dateElement
            ? dateElement.value
            : "";

    const url =
        urlElement.value.trim();


    /* -----------------------------------------
       SELECTED CASES
       ----------------------------------------- */

    const selectedCases =
        getSelectedSourceCases();


    /* -----------------------------------------
       SELECTED PEOPLE
       ----------------------------------------- */

    const selectedPeople =
        getSelectedSourcePeople();


    /* -----------------------------------------
       DEFAULT CURRENT CASE
       ----------------------------------------- */

    if (
        selectedCases.length === 0 &&
        currentCaseId
    ) {

        const numericCaseId =
            Number(
                currentCaseId
            );

        if (
            Number.isInteger(
                numericCaseId
            ) &&
            numericCaseId > 0
        ) {

            selectedCases.push(
                numericCaseId
            );

        }

    }


    /* -----------------------------------------
       VALIDATION
       ----------------------------------------- */

    if (
        !title ||
        !sourceType ||
        !url
    ) {

        setSourceMessage(
            "Please enter a title, source type, and URL."
        );

        return;

    }


    if (
        selectedCases.length === 0 &&
        selectedPeople.length === 0
    ) {

        setSourceMessage(
            "Please associate this source with at least one case or person."
        );

        return;

    }


    try {

        new URL(url);

    } catch {

        setSourceMessage(
            "Please enter a valid source URL."
        );

        return;

    }


    const button =
        document.getElementById(
            "add-source"
        ) ||
        document.querySelector(
            '#source-form button[type="submit"]'
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Adding...";

    }


    try {

        /* -----------------------------------------
           CREATE CENTRAL SOURCE
           ----------------------------------------- */

        const {
            data: sourceData,
            error: sourceError
        } =
            await sourcesSupabase
                .from("sources")
                .insert({

                    case_id:
                        null,

                    title:
                        title,

                    url:
                        url,

                    source_type:
                        sourceType,

                    publication_date:
                        publicationDate ||
                        null

                })
                .select(
                    "id"
                )
                .single();


        if (sourceError) {
            throw sourceError;
        }


        const sourceId =
            sourceData.id;


        /* -----------------------------------------
           CONNECT TO CASES
           ----------------------------------------- */

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
                error: caseError
            } =
                await sourcesSupabase
                    .from("source_cases")
                    .insert(
                        caseRows
                    );


            if (caseError) {
                throw caseError;
            }

        }


        /* -----------------------------------------
           CONNECT TO PEOPLE
           ----------------------------------------- */

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
                error: peopleError
            } =
                await sourcesSupabase
                    .from("source_people")
                    .insert(
                        peopleRows
                    );


            if (peopleError) {
                throw peopleError;
            }

        }


        /* -----------------------------------------
           RESET FORM
           ----------------------------------------- */

        if (form) {
            form.reset();
        }


        if (peopleContainer) {

            peopleContainer
                .querySelectorAll(
                    'input[type="checkbox"]'
                )
                .forEach(
                    function(checkbox) {

                        checkbox.checked =
                            false;

                    }
                );

        }


        if (casesElement) {

            Array.from(
                casesElement.options
            ).forEach(
                function(option) {

                    option.selected =
                        false;

                }
            );

        }


        setSourceMessage(
            "Source added successfully."
        );


        /* -----------------------------------------
           REFRESH CURRENT CASE
           ----------------------------------------- */

        if (currentCaseId) {

            await loadSources(
                currentCaseId
            );

        }


        /* -----------------------------------------
           REFRESH DOCUMENT SOURCES
           ----------------------------------------- */

        if (
            typeof window.loadDocumentSources ===
            "function"
        ) {

            await window.loadDocumentSources(
                currentCaseId
            );

        }


        /* -----------------------------------------
           REFRESH CRIME SCENE PHOTO SOURCES
           ----------------------------------------- */

        if (
            typeof window.loadCrimeScenePhotoSources ===
            "function"
        ) {

            await window.loadCrimeScenePhotoSources(
                currentCaseId
            );

        }

    } catch (error) {

        console.error(
            "Error adding source:",
            error
        );

        setSourceMessage(
            error.message ||
            "Unable to add source."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Add Source";

        }

    }

}


/* -----------------------------------------
   SOURCE MESSAGE
   ----------------------------------------- */

function setSourceMessage(message) {

    const element =
        document.getElementById(
            "source-message"
        );

    if (element) {

        element.textContent =
            message;

    }

}


/* -----------------------------------------
   REMOVE SOURCE
   ----------------------------------------- */

async function removeSource(sourceId) {

    if (!sourceId) {
        return;
    }


    if (
        !confirm(
            "Remove this source completely?"
        )
    ) {

        return;
    }


    try {

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
            throw error;
        }


        const selector =
            document.getElementById(
                "case-selector"
            );

        const caseId =
            selector
                ? selector.value
                : "";


        await loadSources(
            caseId
        );


        if (
            typeof window.loadDocumentSources ===
            "function"
        ) {

            await window.loadDocumentSources(
                caseId
            );

        }


        if (
            typeof window.loadCrimeScenePhotoSources ===
            "function"
        ) {

            await window.loadCrimeScenePhotoSources(
                caseId
            );

        }

    } catch (error) {

        console.error(
            "Error removing source:",
            error
        );

        alert(
            error.message ||
            "Unable to remove source."
        );

    }

}


/* -----------------------------------------
   FORM INITIALIZATION
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const form =
            document.getElementById(
                "source-form"
            );

        if (form) {

            form.addEventListener(
                "submit",
                addSource
            );

        }


        loadSourceCases();

        loadSourcePeople();

    }
);


/* -----------------------------------------
   GLOBAL FUNCTIONS
   ----------------------------------------- */

window.loadSources =
    loadSources;


window.addSource =
    addSource;


window.editSource =
    editSource;


window.updateSource =
    updateSource;


window.removeSource =
    removeSource;


window.loadSourceCases =
    loadSourceCases;


window.loadSourcePeople =
    loadSourcePeople;