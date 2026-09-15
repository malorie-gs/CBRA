// ==================================================
// CBRA — MANAGE RELATED CASES
// ==================================================
//
// Manages relationships between cases.
//
// Database table:
//     related_cases
//
// Fields:
//     id
//     case_id
//     related_case_id
//     relationship_type
// ==================================================


const relatedCasesSupabase =
    window.supabaseClient;


// ==================================================
// LOAD RELATED CASES
// ==================================================

async function loadRelatedCases(caseId) {

    const list =
        document.getElementById(
            "related-case-list"
        );


    if (!list) {

        console.error(
            "CBRA: #related-case-list was not found."
        );

        return;

    }


    if (!caseId) {

        list.innerHTML =
            `<p class="empty-message">
                Select a case to view related cases.
            </p>`;

        return;

    }


    list.innerHTML =
        `<p class="empty-message">
            Loading related cases...
        </p>`;


    // ------------------------------------------
    // GET CONNECTIONS
    // ------------------------------------------

    const {
        data: connections,
        error: connectionError
    } =
        await relatedCasesSupabase
            .from("related_cases")
            .select(
                "id, related_case_id, relationship_type"
            )
            .eq(
                "case_id",
                caseId
            );


    if (connectionError) {

        console.error(
            "Error loading related cases:",
            connectionError
        );


        list.innerHTML =
            `<p class="form-message">
                Error loading related cases:
                ${escapeHTML(
                    connectionError.message
                )}
            </p>`;

        return;

    }


    if (
        !connections ||
        connections.length === 0
    ) {

        list.innerHTML =
            `<p class="empty-message">
                No related cases added yet.
            </p>`;

        return;

    }


    // ------------------------------------------
    // GET RELATED CASE IDS
    // ------------------------------------------

    const relatedCaseIds =
        connections.map(
            connection =>
                connection.related_case_id
        );


    // ------------------------------------------
    // GET CASE INFORMATION
    // ------------------------------------------

    const {
        data: relatedCases,
        error: caseError
    } =
        await relatedCasesSupabase
            .from("cases")
            .select(
                "id, case_name"
            )
            .in(
                "id",
                relatedCaseIds
            );


    if (caseError) {

        console.error(
            "Error loading related case information:",
            caseError
        );


        list.innerHTML =
            `<p class="form-message">
                Error loading case information:
                ${escapeHTML(
                    caseError.message
                )}
            </p>`;

        return;

    }


    // ------------------------------------------
    // CREATE LOOKUP
    // ------------------------------------------

    const caseMap = {};


    (relatedCases || []).forEach(
        relatedCase => {

            caseMap[
                String(
                    relatedCase.id
                )
            ] =
                relatedCase;

        }
    );


    // ------------------------------------------
    // DISPLAY
    // ------------------------------------------

    list.innerHTML = "";


    connections.forEach(
        connection => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "manage-record";


            const relatedCase =
                caseMap[
                    String(
                        connection.related_case_id
                    )
                ];


            // ----------------------------------
            // CASE NAME
            // ----------------------------------

            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                relatedCase
                    ? relatedCase.case_name
                    : "Unknown Case";


            card.appendChild(
                title
            );


            // ----------------------------------
            // RELATIONSHIP
            // ----------------------------------

            if (
                connection.relationship_type
            ) {

                const relationship =
                    document.createElement(
                        "p"
                    );


                relationship.textContent =
                    `Relationship: ${connection.relationship_type}`;


                card.appendChild(
                    relationship
                );

            }


            // ----------------------------------
            // VIEW CASE
            // ----------------------------------

            if (relatedCase) {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    `case.html?id=${relatedCase.id}`;


                link.textContent =
                    "View Case";


                link.target =
                    "_blank";


                link.rel =
                    "noopener noreferrer";


                card.appendChild(
                    link
                );

            }


            // ----------------------------------
            // REMOVE
            // ----------------------------------

            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.className =
                "secondary-button";


            remove.textContent =
                "Remove";


            remove.onclick =
                () => {

                    removeRelatedCase(
                        connection.id
                    );

                };


            card.appendChild(
                remove
            );


            list.appendChild(
                card
            );

        }
    );

}


// ==================================================
// LOAD CASE OPTIONS
// ==================================================

async function loadRelatedCaseOptions(
    currentCaseId
) {

    const selector =
        document.getElementById(
            "related-case-selector"
        );


    if (!selector) {

        console.error(
            "CBRA: #related-case-selector was not found."
        );

        return;

    }


    selector.innerHTML =
        `<option value="">
            -- Select Related Case --
        </option>`;


    if (!currentCaseId) {
        return;
    }


    // ------------------------------------------
    // GET CASES
    // ------------------------------------------

    const {
        data,
        error
    } =
        await relatedCasesSupabase
            .from("cases")
            .select(
                "id, case_name"
            )
            .neq(
                "id",
                currentCaseId
            )
            .order(
                "case_name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading case options:",
            error
        );


        selector.innerHTML =
            `<option value="">
                Error loading cases
            </option>`;


        return;

    }


    // ------------------------------------------
    // ADD OPTIONS
    // ------------------------------------------

    (data || []).forEach(
        relatedCase => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                relatedCase.id;


            option.textContent =
                relatedCase.case_name;


            selector.appendChild(
                option
            );

        }
    );

}


// ==================================================
// ADD RELATED CASE
// ==================================================

async function addRelatedCase() {

    const caseSelector =
        document.getElementById(
            "case-selector"
        );


    const caseId =
        caseSelector
            ? caseSelector.value
            : "";


    if (!caseId) {

        showRelatedCaseMessage(
            "Please select a case first."
        );

        return;

    }


    const relatedCaseSelector =
        document.getElementById(
            "related-case-selector"
        );


    const relationshipElement =
        document.getElementById(
            "related-case-type"
        );


    if (!relatedCaseSelector) {

        console.error(
            "CBRA: #related-case-selector was not found."
        );

        return;

    }


    const relatedCaseId =
        relatedCaseSelector.value;


    const relationshipType =
        relationshipElement
            ? relationshipElement.value.trim()
            : "";


    if (!relatedCaseId) {

        showRelatedCaseMessage(
            "Please select a related case."
        );

        return;

    }


    // ------------------------------------------
    // PREVENT SELF-RELATIONSHIP
    // ------------------------------------------

    if (
        String(caseId) ===
        String(relatedCaseId)
    ) {

        showRelatedCaseMessage(
            "A case cannot be related to itself."
        );

        return;

    }


    // ------------------------------------------
    // CHECK DUPLICATE
    // ------------------------------------------

    const {
        data: existing,
        error: checkError
    } =
        await relatedCasesSupabase
            .from("related_cases")
            .select("id")
            .eq(
                "case_id",
                caseId
            )
            .eq(
                "related_case_id",
                relatedCaseId
            )
            .maybeSingle();


    if (checkError) {

        console.error(
            "Error checking related case:",
            checkError
        );


        showRelatedCaseMessage(
            "Unable to check existing relationship: " +
            checkError.message
        );

        return;

    }


    if (existing) {

        showRelatedCaseMessage(
            "These cases are already connected."
        );

        return;

    }


    // ------------------------------------------
    // BUTTON
    // ------------------------------------------

    const button =
        document.querySelector(
            "#related-case-form button[type='submit']"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Adding...";

    }


    // ------------------------------------------
    // INSERT
    // ------------------------------------------

    const {
        error
    } =
        await relatedCasesSupabase
            .from("related_cases")
            .insert({

                case_id:
                    caseId,

                related_case_id:
                    relatedCaseId,

                relationship_type:
                    relationshipType ||
                    null

            });


    // ------------------------------------------
    // RESTORE BUTTON
    // ------------------------------------------

    if (button) {

        button.disabled =
            false;

        button.textContent =
            "Add Related Case";

    }


    if (error) {

        console.error(
            "Error adding related case:",
            error
        );


        showRelatedCaseMessage(
            "Unable to add related case: " +
            error.message
        );

        return;

    }


    // ------------------------------------------
    // CLEAR FORM
    // ------------------------------------------

    relatedCaseSelector.value =
        "";


    if (relationshipElement) {

        relationshipElement.value =
            "";

    }


    showRelatedCaseMessage(
        "Related case added successfully."
    );


    // ------------------------------------------
    // RELOAD
    // ------------------------------------------

    await loadRelatedCases(
        caseId
    );

}


// ==================================================
// REMOVE RELATED CASE
// ==================================================

async function removeRelatedCase(
    connectionId
) {

    if (!connectionId) {
        return;
    }


    if (
        !confirm(
            "Remove this related-case connection?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await relatedCasesSupabase
            .from("related_cases")
            .delete()
            .eq(
                "id",
                connectionId
            );


    if (error) {

        console.error(
            "Error removing related case:",
            error
        );


        showRelatedCaseMessage(
            "Unable to remove related case: " +
            error.message
        );

        return;

    }


    const caseSelector =
        document.getElementById(
            "case-selector"
        );


    const caseId =
        caseSelector
            ? caseSelector.value
            : "";


    await loadRelatedCases(
        caseId
    );


    showRelatedCaseMessage(
        "Related case removed."
    );

}


// ==================================================
// SHOW MESSAGE
// ==================================================

function showRelatedCaseMessage(
    message
) {

    const element =
        document.getElementById(
            "related-case-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHTML(
    value
) {

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


// ==================================================
// INITIALIZE
// ==================================================

function initializeRelatedCases() {

    console.log(
        "CBRA: Initializing Related Cases..."
    );


    // ------------------------------------------
    // GET CASE SELECTOR
    // ------------------------------------------

    const caseSelector =
        document.getElementById(
            "case-selector"
        );


    if (!caseSelector) {

        console.error(
            "CBRA: #case-selector was not found."
        );

        return;

    }


    // ------------------------------------------
    // GET FORM
    // ------------------------------------------

    const form =
        document.getElementById(
            "related-case-form"
        );


    if (!form) {

        console.error(
            "CBRA: #related-case-form was not found."
        );

        return;

    }


    // ------------------------------------------
    // FORM SUBMIT
    // ------------------------------------------

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            addRelatedCase();

        }
    );


    // ------------------------------------------
    // CASE CHANGE
    // ------------------------------------------

    caseSelector.addEventListener(
        "change",
        async () => {

            const caseId =
                caseSelector.value;


            await loadRelatedCases(
                caseId
            );


            await loadRelatedCaseOptions(
                caseId
            );

        }
    );


    // ------------------------------------------
    // INITIAL LOAD
    // ------------------------------------------

    if (
        caseSelector.value
    ) {

        loadRelatedCases(
            caseSelector.value
        );


        loadRelatedCaseOptions(
            caseSelector.value
        );

    }

}


// ==================================================
// START
// ==================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeRelatedCases
    );

} else {

    initializeRelatedCases();

}


// ==================================================
// GLOBAL FUNCTIONS
// ==================================================

window.loadRelatedCases =
    loadRelatedCases;

window.loadRelatedCaseOptions =
    loadRelatedCaseOptions;

window.addRelatedCase =
    addRelatedCase;

window.removeRelatedCase =
    removeRelatedCase;