/* =========================================
   COURT RECORDS & DOCUMENTS
   ========================================= */

const documentsSupabase = window.supabaseClient;


/* -----------------------------------------
   BUILD DOCUMENT MANAGEMENT UI
   ----------------------------------------- */

function buildDocumentsManagementUI() {

    const container =
        document.getElementById(
            "documents-management"
        );

    if (!container) return;

    container.innerHTML = `
        <div class="management-subsection">

            <h3>Add Court Record / Document</h3>

            <form id="documents-form">

                <div class="form-grid">

                    <div class="form-group">
                        <label for="document-title">
                            Title
                        </label>

                        <input
                            type="text"
                            id="document-title"
                            placeholder="Example: Sentencing Decision"
                            required
                        >
                    </div>


                    <div class="form-group">
                        <label for="document-type">
                            Document Type
                        </label>

                        <input
                            type="text"
                            id="document-type"
                            placeholder="Example: Court Filing"
                            required
                        >
                    </div>


                    <div class="form-group">
                        <label for="document-date">
                            Publication / Filing Date
                        </label>

                        <input
                            type="date"
                            id="document-date"
                        >
                    </div>


                    <div class="form-group">
                        <label for="document-source">
                            Source
                        </label>

                        <select id="document-source">

                            <option value="">
                                No source selected
                            </option>

                        </select>
                    </div>


                    <div class="form-group form-group-wide">

                        <label for="document-people">
                            People Associated With This Document
                        </label>

                        <select
                            id="document-people"
                            multiple
                            size="6"
                        ></select>

                        <small>
                            Hold Ctrl (Windows) or Command (Mac) to select multiple people.
                        </small>

                    </div>


                    <div class="form-group form-group-wide">

                        <label for="document-file">
                            Document File
                        </label>

                        <input
                            type="file"
                            id="document-file"
                            accept=".pdf,.doc,.docx,.txt,.rtf"
                            required
                        >

                        <small>
                            Upload a PDF, DOC, DOCX, TXT, or RTF file.
                        </small>

                    </div>


                    <div class="form-group form-group-wide">

                        <label for="document-description">
                            Description
                        </label>

                        <textarea
                            id="document-description"
                            rows="4"
                            placeholder="Brief description of the document..."
                        ></textarea>

                    </div>

                </div>


                <button
                    type="submit"
                    id="add-document"
                    class="primary-button"
                >
                    Add Document
                </button>


                <p
                    id="document-message"
                    class="form-message"
                ></p>

            </form>

        </div>


        <div class="management-subsection">

            <h3>
                Current Court Records &amp; Documents
            </h3>

            <div id="manage-documents-list">

                <p class="empty-message">
                    Select a case to view its documents.
                </p>

            </div>

        </div>
    `;
}


/* -----------------------------------------
   GET CURRENT CASE ID
   ----------------------------------------- */

function getCurrentDocumentsCaseId() {

    const selector =
        document.getElementById(
            "case-selector"
        );

    if (!selector || !selector.value) {
        return null;
    }

    return selector.value;
}


/* -----------------------------------------
   LOAD DOCUMENTS
   ----------------------------------------- */

async function loadDocuments(caseId) {

    const list =
        document.getElementById(
            "manage-documents-list"
        );

    if (!list) return;


    if (!caseId) {

        list.innerHTML = `
            <p class="empty-message">
                Select a case to view its documents.
            </p>
        `;

        return;
    }


    list.innerHTML = `
        <p class="empty-message">
            Loading documents...
        </p>
    `;


    const {
        data,
        error
    } =
        await documentsSupabase
            .from("document_cases")
            .select(`
                id,
                document_id,
                document:documents (
                    id,
                    title,
                    document_url,
                    document_type,
                    publication_date,
                    description,
                    source_id,
                    source:sources (
                        id,
                        title
                    )
                )
            `)
            .eq(
                "case_id",
                caseId
            );


    if (error) {

        console.error(
            "Error loading documents:",
            error
        );

        list.innerHTML = `
            <p class="form-message">
                Unable to load documents.
            </p>
        `;

        return;
    }


    const documents =
        (data || [])
            .map(
                function(connection) {

                    return connection.document;

                }
            )
            .filter(
                function(documentRecord) {

                    return Boolean(
                        documentRecord
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


    if (documents.length === 0) {

        list.innerHTML = `
            <p class="empty-message">
                No court records or documents have been added to this case yet.
            </p>
        `;

        return;
    }


    list.innerHTML =
        documents.map(
            function(documentRecord) {

                const date =
                    documentRecord.publication_date
                        ? documentRecord.publication_date
                        : "";


                const source =
                    documentRecord.source
                        ? documentRecord.source.title
                        : "";


                return `
                    <div
                        class="manage-record"
                        id="document-record-${documentRecord.id}"
                    >

                        <div>

                            <strong>
                                ${escapeDocumentHTML(
                                    documentRecord.title ||
                                    "Untitled Document"
                                )}
                            </strong>


                            ${
                                documentRecord.document_type
                                    ? `
                                        <div>
                                            ${escapeDocumentHTML(
                                                documentRecord.document_type
                                            )}
                                        </div>
                                    `
                                    : ""
                            }


                            ${
                                date
                                    ? `
                                        <div>
                                            ${escapeDocumentHTML(
                                                date
                                            )}
                                        </div>
                                    `
                                    : ""
                            }


                            ${
                                source
                                    ? `
                                        <div>
                                            <strong>Source:</strong>
                                            ${escapeDocumentHTML(
                                                source
                                            )}
                                        </div>
                                    `
                                    : ""
                            }


                            ${
                                documentRecord.description
                                    ? `
                                        <p>
                                            ${escapeDocumentHTML(
                                                documentRecord.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                documentRecord.document_url
                                    ? `
                                        <a
                                            href="${escapeDocumentAttribute(
                                                documentRecord.document_url
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open Document
                                        </a>
                                    `
                                    : ""
                            }

                        </div>


                        <div class="document-management-buttons">

                            <button
                                type="button"
                                class="secondary-button"
                                onclick="editDocument(${documentRecord.id})"
                            >
                                Edit Document
                            </button>


                            <button
                                type="button"
                                class="secondary-button"
                                onclick="removeDocument(${documentRecord.id})"
                            >
                                Remove
                            </button>

                        </div>

                    </div>
                `;

            }
        ).join("");
}


/* =========================================
   GET PEOPLE ASSOCIATED WITH DOCUMENT
   ========================================= */

async function getDocumentPeople(
    documentId
) {

    const {
        data,
        error
    } =
        await documentsSupabase
            .from("document_people")
            .select(`
                person_id,
                person:people (
                    id,
                    display_name
                )
            `)
            .eq(
                "document_id",
                documentId
            );


    if (error) {

        console.error(
            "Error loading document people:",
            error
        );

        return [];
    }


    return (data || [])
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


/* =========================================
   GET PEOPLE ASSOCIATED WITH CASE
   ========================================= */

async function getCasePeopleForDocument(
    caseId
) {

    if (!caseId) {
        return [];
    }


    const {
        data,
        error
    } =
        await documentsSupabase
            .from("case_people")
            .select(`
                person_id,
                person:people (
                    id,
                    display_name
                )
            `)
            .eq(
                "case_id",
                Number(caseId)
            );


    if (error) {

        console.error(
            "Error loading case people for document:",
            error
        );

        return [];
    }


    return (data || [])
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
        )
        .sort(
            function(a, b) {

                return String(
                    a.display_name || ""
                ).localeCompare(
                    String(
                        b.display_name || ""
                    )
                );

            }
        );
}


/* =========================================
   EDIT DOCUMENT
   ========================================= */

async function editDocument(documentId) {

    const record =
        document.getElementById(
            `document-record-${documentId}`
        );


    if (!record) {

        console.error(
            "Document record element not found:",
            documentId
        );

        return;
    }


    const {
        data: documentRecord,
        error
    } =
        await documentsSupabase
            .from("documents")
            .select(`
                id,
                title,
                document_type,
                publication_date,
                description,
                document_url,
                source_id
            `)
            .eq(
                "id",
                documentId
            )
            .single();


    if (error) {

        console.error(
            "Error loading document for editing:",
            error
        );

        alert(
            "Unable to load this document for editing."
        );

        return;
    }


    /* -----------------------------------------
       CURRENT CASE
       ----------------------------------------- */

    const caseId =
        getCurrentDocumentsCaseId();


    /* -----------------------------------------
       LOAD SOURCES
       ----------------------------------------- */

    const {
        data: sources,
        error: sourceError
    } =
        await documentsSupabase
            .from("sources")
            .select(`
                id,
                title
            `)
            .order(
                "title",
                {
                    ascending: true
                }
            );


    if (sourceError) {

        console.error(
            "Error loading sources for document edit:",
            sourceError
        );

        alert(
            "Unable to load the source list."
        );

        return;
    }


    /* -----------------------------------------
       LOAD PEOPLE
       ----------------------------------------- */

    const [
        casePeople,
        documentPeople
    ] = await Promise.all([
        getCasePeopleForDocument(
            caseId
        ),
        getDocumentPeople(
            documentId
        )
    ]);


    /* -----------------------------------------
       CURRENT PERSON IDS
       ----------------------------------------- */

    const currentPersonIds =
        new Set(
            documentPeople.map(
                function(person) {

                    return String(
                        person.id
                    );

                }
            )
        );


    /* -----------------------------------------
       SOURCE OPTIONS
       ----------------------------------------- */

    const sourceOptions =
        (sources || [])
            .map(
                function(source) {

                    const selected =
                        Number(
                            documentRecord.source_id
                        ) === Number(
                            source.id
                        )
                            ? "selected"
                            : "";


                    return `
                        <option
                            value="${source.id}"
                            ${selected}
                        >
                            ${escapeDocumentHTML(
                                source.title ||
                                "Untitled Source"
                            )}
                        </option>
                    `;

                }
            )
            .join("");


    /* -----------------------------------------
       PEOPLE OPTIONS
       ----------------------------------------- */

    const peopleOptions =
        casePeople
            .map(
                function(person) {

                    const selected =
                        currentPersonIds.has(
                            String(
                                person.id
                            )
                        )
                            ? "selected"
                            : "";


                    return `
                        <option
                            value="${person.id}"
                            ${selected}
                        >
                            ${escapeDocumentHTML(
                                person.display_name ||
                                "Unnamed Person"
                            )}
                        </option>
                    `;

                }
            )
            .join("");


    /* -----------------------------------------
       EDIT FORM
       ----------------------------------------- */

    record.innerHTML = `
        <div class="document-edit-form">

            <h4>
                Edit Court Record / Document
            </h4>


            <div class="form-grid">

                <div class="form-group">

                    <label>
                        Title
                    </label>

                    <input
                        type="text"
                        id="edit-document-title-${documentId}"
                        value="${escapeDocumentAttribute(
                            documentRecord.title || ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Document Type
                    </label>

                    <input
                        type="text"
                        id="edit-document-type-${documentId}"
                        value="${escapeDocumentAttribute(
                            documentRecord.document_type || ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Publication / Filing Date
                    </label>

                    <input
                        type="date"
                        id="edit-document-date-${documentId}"
                        value="${escapeDocumentAttribute(
                            documentRecord.publication_date || ""
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Source
                    </label>

                    <select
                        id="edit-document-source-${documentId}"
                    >

                        <option value="">
                            No source selected
                        </option>

                        ${sourceOptions}

                    </select>

                </div>


                <div class="form-group form-group-wide">

                    <label
                        for="edit-document-people-${documentId}"
                    >
                        People Associated With This Document
                    </label>


                    ${
                        casePeople.length > 0
                            ? `
                                <select
                                    id="edit-document-people-${documentId}"
                                    multiple
                                    size="6"
                                >
                                    ${peopleOptions}
                                </select>

                                <small>
                                    Select all people who should be associated with this document.
                                    Hold Ctrl (Windows) or Command (Mac) to select multiple people.
                                </small>
                            `
                            : `
                                <p class="empty-message">
                                    No people are currently associated with this case.
                                </p>
                            `
                    }

                </div>


                <div class="form-group form-group-wide">

                    <label>
                        Description
                    </label>

                    <textarea
                        id="edit-document-description-${documentId}"
                        rows="4"
                    >${escapeDocumentHTML(
                        documentRecord.description || ""
                    )}</textarea>

                </div>


                <div class="form-group form-group-wide">

                    <label>
                        Current File
                    </label>

                    ${
                        documentRecord.document_url
                            ? `
                                <a
                                    href="${escapeDocumentAttribute(
                                        documentRecord.document_url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open Current Document
                                </a>
                            `
                            : `
                                <span>
                                    No document file available.
                                </span>
                            `
                    }

                    <small>
                        Editing these fields does not replace the uploaded file.
                    </small>

                </div>

            </div>


            <div class="document-management-buttons">

                <button
                    type="button"
                    class="primary-button"
                    onclick="saveDocumentEdit(${documentId})"
                >
                    Save Changes
                </button>


                <button
                    type="button"
                    class="secondary-button"
                    onclick="cancelDocumentEdit(${documentId})"
                >
                    Cancel
                </button>

            </div>


            <p
                id="edit-document-message-${documentId}"
                class="form-message"
            ></p>

        </div>
    `;
}


/* =========================================
   SAVE DOCUMENT EDIT
   ========================================= */

async function saveDocumentEdit(
    documentId
) {

    const titleElement =
        document.getElementById(
            `edit-document-title-${documentId}`
        );


    const typeElement =
        document.getElementById(
            `edit-document-type-${documentId}`
        );


    const dateElement =
        document.getElementById(
            `edit-document-date-${documentId}`
        );


    const sourceElement =
        document.getElementById(
            `edit-document-source-${documentId}`
        );


    const peopleElement =
        document.getElementById(
            `edit-document-people-${documentId}`
        );


    const descriptionElement =
        document.getElementById(
            `edit-document-description-${documentId}`
        );


    const messageElement =
        document.getElementById(
            `edit-document-message-${documentId}`
        );


    if (
        !titleElement ||
        !typeElement ||
        !dateElement ||
        !sourceElement ||
        !descriptionElement
    ) {

        console.error(
            "Document edit fields could not be found."
        );

        return;
    }


    /* -----------------------------------------
       VALUES
       ----------------------------------------- */

    const title =
        titleElement.value.trim();


    const documentType =
        typeElement.value.trim();


    const publicationDate =
        dateElement.value ||
        null;


    const sourceId =
        sourceElement.value
            ? Number(
                sourceElement.value
            )
            : null;


    const description =
        descriptionElement.value.trim() ||
        null;


    /* -----------------------------------------
       SELECTED PEOPLE
       ----------------------------------------- */

    const selectedPeople = [];


    if (peopleElement) {

        Array.from(
            peopleElement.selectedOptions
        ).forEach(
            function(option) {

                const personId =
                    Number(
                        option.value
                    );


                if (
                    Number.isInteger(
                        personId
                    ) &&
                    personId > 0
                ) {

                    selectedPeople.push(
                        personId
                    );

                }

            }
        );
    }


    /* -----------------------------------------
       VALIDATION
       ----------------------------------------- */

    if (!title) {

        if (messageElement) {

            messageElement.textContent =
                "Document title is required.";

        }

        return;
    }


    if (!documentType) {

        if (messageElement) {

            messageElement.textContent =
                "Document type is required.";

        }

        return;
    }


    if (messageElement) {

        messageElement.textContent =
            "Saving changes...";

    }


    /* -----------------------------------------
       UPDATE DOCUMENT
       ----------------------------------------- */

    const {
        data,
        error
    } =
        await documentsSupabase
            .from("documents")
            .update({
                title:
                    title,

                document_type:
                    documentType,

                publication_date:
                    publicationDate,

                description:
                    description,

                source_id:
                    sourceId
            })
            .eq(
                "id",
                documentId
            )
            .select()
            .single();


    if (error) {

        console.error(
            "Error updating document:",
            error
        );

        if (messageElement) {

            messageElement.textContent =
                error.message ||
                "Unable to save changes.";

        }

        return;
    }


    if (!data) {

        if (messageElement) {

            messageElement.textContent =
                "No document was updated.";

        }

        return;
    }


    /* =========================================
       UPDATE DOCUMENT ↔ PEOPLE CONNECTIONS
       ========================================= */


    /*
     * First remove the existing associations.
     */

    const {
        error: deletePeopleError
    } =
        await documentsSupabase
            .from("document_people")
            .delete()
            .eq(
                "document_id",
                documentId
            );


    if (deletePeopleError) {

        console.error(
            "Error clearing document people associations:",
            deletePeopleError
        );


        if (messageElement) {

            messageElement.textContent =
                "Document was updated, but the people associations could not be updated.";

        }

        return;
    }


    /*
     * Then insert the currently selected people.
     */

    if (
        selectedPeople.length > 0
    ) {

        const peopleRows =
            selectedPeople.map(
                function(personId) {

                    return {
                        document_id:
                            documentId,

                        person_id:
                            personId
                    };

                }
            );


        const {
            error: insertPeopleError
        } =
            await documentsSupabase
                .from("document_people")
                .insert(
                    peopleRows
                );


        if (insertPeopleError) {

            console.error(
                "Error saving document people associations:",
                insertPeopleError
            );


            if (messageElement) {

                messageElement.textContent =
                    "Document was updated, but the people associations could not be saved.";

            }

            return;
        }

    }


    /* -----------------------------------------
       SUCCESS
       ----------------------------------------- */

    if (messageElement) {

        messageElement.textContent =
            "Document and associated people updated successfully.";

    }


    /* -----------------------------------------
       RELOAD DOCUMENT LIST
       ----------------------------------------- */

    const caseId =
        getCurrentDocumentsCaseId();


    if (caseId) {

        await loadDocuments(
            caseId
        );

    }
}


/* -----------------------------------------
   CANCEL DOCUMENT EDIT
   ----------------------------------------- */

async function cancelDocumentEdit(
    documentId
) {

    const caseId =
        getCurrentDocumentsCaseId();


    if (caseId) {

        await loadDocuments(
            caseId
        );

    }

}
/* =========================================
   LOAD DOCUMENT SOURCES
   ========================================= */

async function loadDocumentSources(
    caseId
) {

    const sourceSelect =
        document.getElementById(
            "document-source"
        );

    if (!sourceSelect) return;

    sourceSelect.innerHTML = `
        <option value="">
            No source selected
        </option>
    `;

    if (!caseId) return;

    const {
        data,
        error
    } =
        await documentsSupabase
            .from("sources")
            .select(`
                id,
                title
            `)
            .eq(
                "case_id",
                Number(caseId)
            )
            .order(
                "title",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Error loading document sources:",
            error
        );

        return;
    }

    if (!data) return;

    data.forEach(
        function(source) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(
                    source.id
                );

            option.textContent =
                source.title ||
                "Untitled Source";

            sourceSelect.appendChild(
                option
            );

        }
    );

}


/* =========================================
   LOAD CASE PEOPLE
   ========================================= */

async function loadDocumentPeople(
    caseId
) {

    const peopleSelect =
        document.getElementById(
            "document-people"
        );


    if (!peopleSelect) return;


    peopleSelect.innerHTML = "";


    if (!caseId) return;


    const {
        data,
        error
    } =
        await documentsSupabase
            .from("case_people")
            .select(`
                person_id,
                person:people (
                    id,
                    display_name
                )
            `)
            .eq(
                "case_id",
                Number(caseId)
            );


    if (error) {

        console.error(
            "Error loading case people:",
            error
        );

        peopleSelect.innerHTML = `
            <option disabled>
                Unable to load people
            </option>
        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        peopleSelect.innerHTML = `
            <option disabled>
                No people are assigned to this case
            </option>
        `;

        return;
    }


    data
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
        )
        .sort(
            function(a, b) {

                return String(
                    a.display_name || ""
                ).localeCompare(
                    String(
                        b.display_name || ""
                    )
                );

            }
        )
        .forEach(
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


                option.selected =
                    false;


                peopleSelect.appendChild(
                    option
                );

            }
        );


    Array.from(
        peopleSelect.options
    ).forEach(
        function(option) {

            option.selected =
                false;

        }
    );

}


/* =========================================
   ADD DOCUMENT
   ========================================= */

async function addDocument() {

    const selector =
        document.getElementById(
            "case-selector"
        );


    const caseId =
        selector
            ? selector.value
            : "";


    if (!caseId) {

        alert(
            "Please select a case first."
        );

        return;
    }


    const titleElement =
        document.getElementById(
            "document-title"
        );


    const fileElement =
        document.getElementById(
            "document-file"
        );


    const typeElement =
        document.getElementById(
            "document-type"
        );


    const dateElement =
        document.getElementById(
            "document-date"
        );


    const descriptionElement =
        document.getElementById(
            "document-description"
        );


    const sourceElement =
        document.getElementById(
            "document-source"
        );


    const peopleElement =
        document.getElementById(
            "document-people"
        );


    const title =
        titleElement.value.trim();


    const file =
        fileElement.files[0];


    const type =
        typeElement.value.trim();


    const date =
        dateElement.value;


    const description =
        descriptionElement.value.trim();


    const sourceId =
        sourceElement.value
            ? Number(
                sourceElement.value
            )
            : null;


    const selectedPeople = [];


    if (peopleElement) {

        Array.from(
            peopleElement.selectedOptions
        ).forEach(
            function(option) {

                const personId =
                    Number(
                        option.value
                    );


                if (
                    Number.isInteger(
                        personId
                    ) &&
                    personId > 0
                ) {

                    selectedPeople.push(
                        personId
                    );

                }

            }
        );

    }


    if (!title) {

        alert(
            "Please enter a document title."
        );

        return;
    }


    if (!file) {

        alert(
            "Please select a document file."
        );

        return;
    }


    if (!type) {

        alert(
            "Please enter a document type."
        );

        return;
    }


    const button =
        document.getElementById(
            "add-document"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Uploading...";

    }


    let filePath =
        null;

    let documentId =
        null;


    try {

        const allowedExtensions = [
            "pdf",
            "doc",
            "docx",
            "txt",
            "rtf"
        ];


        const originalName =
            file.name;


        const extension =
            originalName
                .split(".")
                .pop()
                .toLowerCase();


        if (
            !allowedExtensions.includes(
                extension
            )
        ) {

            throw new Error(
                "Unsupported document type."
            );

        }


        const safeFileName =
            originalName
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


        filePath =
            `${caseId}/${Date.now()}-${safeFileName}`;


        const {
            error: uploadError
        } =
            await documentsSupabase
                .storage
                .from("case-documents")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (uploadError) {

            throw uploadError;

        }


        const {
            data: publicUrlData
        } =
            documentsSupabase
                .storage
                .from("case-documents")
                .getPublicUrl(
                    filePath
                );


        const documentUrl =
            publicUrlData.publicUrl;


        const {
            data: documentData,
            error: documentError
        } =
            await documentsSupabase
                .from("documents")
                .insert({
                    title:
                        title,

                    description:
                        description ||
                        null,

                    document_url:
                        documentUrl,

                    document_type:
                        type,

                    publication_date:
                        date ||
                        null,

                    source_id:
                        sourceId
                })
                .select(
                    "id"
                )
                .single();


        if (documentError) {

            throw documentError;

        }


        documentId =
            documentData.id;


        /* -----------------------------------------
           CONNECT DOCUMENT TO CASE
           ----------------------------------------- */

        const {
            error: caseConnectionError
        } =
            await documentsSupabase
                .from("document_cases")
                .insert({
                    document_id:
                        documentId,

                    case_id:
                        Number(caseId)
                });


        if (caseConnectionError) {

            throw caseConnectionError;

        }


        /* -----------------------------------------
           CONNECT DOCUMENT TO PEOPLE
           ----------------------------------------- */

        if (
            selectedPeople.length > 0
        ) {

            const peopleRows =
                selectedPeople.map(
                    function(personId) {

                        return {
                            document_id:
                                documentId,

                            person_id:
                                personId
                        };

                    }
                );


            const {
                error:
                    peopleConnectionError
            } =
                await documentsSupabase
                    .from("document_people")
                    .insert(
                        peopleRows
                    );


            if (
                peopleConnectionError
            ) {

                throw peopleConnectionError;

            }

        }


        /* -----------------------------------------
           RESET FORM
           ----------------------------------------- */

        const form =
            document.getElementById(
                "documents-form"
            );


        if (form) {

            form.reset();

        }


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Add Document";

        }


        await loadDocuments(
            caseId
        );


        await loadDocumentSources(
            caseId
        );


        await loadDocumentPeople(
            caseId
        );


    } catch (error) {

        console.error(
            "Error adding document:",
            error
        );


        if (documentId) {

            await documentsSupabase
                .from("documents")
                .delete()
                .eq(
                    "id",
                    documentId
                );

        }


        if (filePath) {

            const {
                error:
                    cleanupStorageError
            } =
                await documentsSupabase
                    .storage
                    .from("case-documents")
                    .remove([
                        filePath
                    ]);


            if (
                cleanupStorageError
            ) {

                console.error(
                    "Storage cleanup error:",
                    cleanupStorageError
                );

            }

        }


        alert(
            "Unable to upload the document. Check the console for details."
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Add Document";

        }

    }

}


/* =========================================
   REMOVE DOCUMENT FROM CASE
   ========================================= */

async function removeDocument(
    documentId
) {

    if (
        !confirm(
            "Remove this document from this case?"
        )
    ) {

        return;

    }


    const selector =
        document.getElementById(
            "case-selector"
        );


    const caseId =
        selector
            ? selector.value
            : "";


    const {
        data: documentRecord,
        error: fetchError
    } =
        await documentsSupabase
            .from("documents")
            .select(
                "id, document_url"
            )
            .eq(
                "id",
                documentId
            )
            .single();


    if (fetchError) {

        console.error(
            "Error finding document:",
            fetchError
        );

        alert(
            "Unable to find the document."
        );

        return;

    }


    const {
        error: connectionDeleteError
    } =
        await documentsSupabase
            .from("document_cases")
            .delete()
            .eq(
                "document_id",
                documentId
            )
            .eq(
                "case_id",
                Number(caseId)
            );


    if (connectionDeleteError) {

        console.error(
            "Error removing document from case:",
            connectionDeleteError
        );

        alert(
            "Unable to remove the document from this case."
        );

        return;

    }


    const {
        count: caseCount,
        error: caseCountError
    } =
        await documentsSupabase
            .from("document_cases")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "document_id",
                documentId
            );


    const {
        count: peopleCount,
        error: peopleCountError
    } =
        await documentsSupabase
            .from("document_people")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "document_id",
                documentId
            );


    if (
        caseCountError ||
        peopleCountError
    ) {

        console.error(
            "Error checking document connections:",
            caseCountError ||
            peopleCountError
        );

        await loadDocuments(
            caseId
        );

        return;

    }


    if (
        Number(caseCount || 0) === 0 &&
        Number(peopleCount || 0) === 0
    ) {

        const {
            error: deleteDocumentError
        } =
            await documentsSupabase
                .from("documents")
                .delete()
                .eq(
                    "id",
                    documentId
                );


        if (deleteDocumentError) {

            console.error(
                "Error deleting central document:",
                deleteDocumentError
            );

            alert(
                "The document was removed from the case, but the central document could not be deleted."
            );

            await loadDocuments(
                caseId
            );

            return;

        }


        if (
            documentRecord &&
            documentRecord.document_url
        ) {

            const publicUrl =
                documentRecord.document_url;


            const marker =
                "/storage/v1/object/public/case-documents/";


            const markerIndex =
                publicUrl.indexOf(
                    marker
                );


            if (
                markerIndex !== -1
            ) {

                const filePath =
                    decodeURIComponent(
                        publicUrl.substring(
                            markerIndex +
                            marker.length
                        )
                    );


                const {
                    error: storageError
                } =
                    await documentsSupabase
                        .storage
                        .from("case-documents")
                        .remove([
                            filePath
                        ]);


                if (storageError) {

                    console.error(
                        "Document deleted from database, but Storage file could not be removed:",
                        storageError
                    );

                }

            }

        }

    }


    await loadDocuments(
        caseId
    );

}


/* =========================================
   ESCAPE HTML
   ========================================= */

function escapeDocumentHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


/* =========================================
   ESCAPE ATTRIBUTE
   ========================================= */

function escapeDocumentAttribute(
    value
) {

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


/* =========================================
   INITIALIZE
   ========================================= */

function initializeDocumentsManagement() {

    buildDocumentsManagementUI();


    const form =
        document.getElementById(
            "documents-form"
        );


    const selector =
        document.getElementById(
            "case-selector"
        );


    if (form) {

        form.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                addDocument();

            }
        );

    }


    if (selector) {

        selector.addEventListener(
            "change",
            function() {

                loadDocuments(
                    this.value
                );

                loadDocumentSources(
                    this.value
                );

                loadDocumentPeople(
                    this.value
                );

            }
        );


        if (selector.value) {

            loadDocuments(
                selector.value
            );

            loadDocumentSources(
                selector.value
            );

            loadDocumentPeople(
                selector.value
            );

        }

    }

}


/* =========================================
   START
   ========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDocumentsManagement
    );

} else {

    initializeDocumentsManagement();

}


/* =========================================
   GLOBAL EXPORTS
   ========================================= */

window.loadDocuments =
    loadDocuments;

window.addDocument =
    addDocument;

window.editDocument =
    editDocument;

window.saveDocumentEdit =
    saveDocumentEdit;

window.cancelDocumentEdit =
    cancelDocumentEdit;

window.removeDocument =
    removeDocument;

window.loadDocumentSources =
    loadDocumentSources;

window.loadDocumentPeople =
    loadDocumentPeople;

window.getDocumentPeople =
    getDocumentPeople;

window.getCasePeopleForDocument =
    getCasePeopleForDocument;