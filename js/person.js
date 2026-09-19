// ============================================================
// CBRA - Person Profile & Management
// ============================================================


// ============================================================
// Supabase configuration
// ============================================================

const SUPABASE_URL =
    "https://xjbysfrceqtljatsijsy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_iRC9CutWA2fMgucVMtiOEw_f7uSu-3W";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

window.supabaseClient = supabaseClient;


// ============================================================
// CBRA Admin
// ============================================================

const CBRA_ADMIN_USER_ID =
    "b8d830af-7439-4866-97e7-0634121daca4";

let CBRA_IS_ADMIN = false;


// ============================================================
// Authentication
// ============================================================

async function checkAdminStatus() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error) {

            console.error(
                "Error checking authentication:",
                error
            );

            CBRA_IS_ADMIN = false;

            updateAuthInterface();

            removeAdminInterface();

            return false;

        }


        const user =
            data?.user;


        CBRA_IS_ADMIN =
            !!user &&
            user.id === CBRA_ADMIN_USER_ID;


        updateAuthInterface();


        if (!CBRA_IS_ADMIN) {

            removeAdminInterface();

        }


        return CBRA_IS_ADMIN;

    } catch (error) {

        console.error(
            "Unexpected authentication error:",
            error
        );

        CBRA_IS_ADMIN = false;

        updateAuthInterface();

        removeAdminInterface();

        return false;

    }

}


// ============================================================
// Authentication Interface
// ============================================================

function updateAuthInterface() {

    let authContainer =
        document.getElementById(
            "cbra-person-auth-controls"
        );


    if (!authContainer) {

        const header =
            document.querySelector(
                "header"
            );


        if (!header) {

            return;

        }


        authContainer =
            document.createElement(
                "div"
            );


        authContainer.id =
            "cbra-person-auth-controls";


        authContainer.style.marginTop =
            "15px";


        authContainer.style.textAlign =
            "center";


        header.appendChild(
            authContainer
        );

    }


    authContainer.innerHTML =
        "";


    if (!CBRA_IS_ADMIN) {

        return;

    }


    const logoutButton =
        document.createElement(
            "button"
        );


    logoutButton.type =
        "button";


    logoutButton.id =
        "person-logout-button";


    logoutButton.textContent =
        "Log Out";


    logoutButton.addEventListener(
        "click",
        logoutAdmin
    );


    authContainer.appendChild(
        logoutButton
    );

}


// ============================================================
// Logout
// ============================================================

async function logoutAdmin() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Error logging out:",
            error
        );

        alert(
            "Could not log out: " +
            error.message
        );

        return;

    }


    CBRA_IS_ADMIN =
        false;


    removeAdminInterface();

    updateAuthInterface();

}


// ============================================================
// Remove Admin Interface
// ============================================================

function removeAdminInterface() {

    const controls =
        document.getElementById(
            "person-management-controls"
        );


    if (controls) {

        controls.remove();

    }


    const adminForms = [

        "edit-person-form",

        "person-mugshot-form",

        "person-document-form",

        "person-source-form",

        "mental-health-document-form"

    ];


    adminForms.forEach(
        function(id) {

            const element =
                document.getElementById(id);


            if (element) {

                element.remove();

            }

        }
    );


    // Remove any dynamically-created admin buttons
    // that may already exist in content.

    document
        .querySelectorAll(
            ".cbra-admin-only"
        )
        .forEach(
            element => element.remove()
        );

}


// ============================================================
// Listen For Authentication Changes
// ============================================================

supabaseClient.auth.onAuthStateChange(
    async function() {

        await checkAdminStatus();

    }
);


// ============================================================
// Get Person ID From URL
// ============================================================

function getPersonId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("id");

}


// ============================================================
// Helpers
// ============================================================

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


function displayValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Not available";

    }


    return escapeHtml(value);

}


function showError(message) {

    const loading =
        document.getElementById(
            "person-loading"
        );


    const profile =
        document.getElementById(
            "person-profile"
        );


    const error =
        document.getElementById(
            "person-error"
        );


    const errorMessage =
        document.getElementById(
            "person-error-message"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (profile) {

        profile.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "block";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

}


function formatDate(date) {

    if (!date) {

        return "Not available";

    }


    const dateString =
        String(date).substring(0, 10);


    const parts =
        dateString.split("-");


    if (parts.length !== 3) {

        return escapeHtml(date);

    }


    const year =
        Number(parts[0]);


    const month =
        Number(parts[1]);


    const day =
        Number(parts[2]);


    if (
        !year ||
        !month ||
        !day
    ) {

        return escapeHtml(date);

    }


    const months = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];


    return `${months[month - 1]} ${day}, ${year}`;

}


// ============================================================
// Load Person
// ============================================================

async function loadPerson() {

    const personId =
        getPersonId();


    if (!personId) {

        showError(
            "No person was specified."
        );

        return;

    }


    try {

        const {
            data: person,
            error
        } =
            await supabaseClient
                .from("people")
                .select(`
                    id,
                    display_name,
                    age_at_case,
                    date_of_birth,
                    gender
                `)
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

            showError(
                "There was a problem loading this person."
            );

            return;

        }


        if (!person) {

            showError(
                "This person could not be found."
            );

            return;

        }


        document.title =
            `${person.display_name} | CBRA`;


        const nameElement =
            document.getElementById(
                "person-name"
            );


        if (nameElement) {

            nameElement.textContent =
                person.display_name ||
                "Unnamed Person";

        }


        const basicInfo = [];


        if (person.gender) {

            basicInfo.push(
                person.gender
            );

        }


        if (
            person.age_at_case !== null &&
            person.age_at_case !== undefined
        ) {

            basicInfo.push(
                `Age ${person.age_at_case} at case`
            );

        }


        const basicInfoElement =
            document.getElementById(
                "person-basic-info"
            );


        if (basicInfoElement) {

            basicInfoElement.textContent =
                basicInfo.join(" • ");

        }


        const dobElement =
            document.getElementById(
                "person-dob"
            );


        if (dobElement) {

            dobElement.textContent =
                formatDate(
                    person.date_of_birth
                );

        }


        const ageElement =
            document.getElementById(
                "person-age"
            );


        if (ageElement) {

            ageElement.textContent =
                displayValue(
                    person.age_at_case
                );

        }


        const genderElement =
            document.getElementById(
                "person-gender"
            );


        if (genderElement) {

            genderElement.textContent =
                displayValue(
                    person.gender
                );

        }


        // Check authentication BEFORE
        // creating any management controls.

        const isAdmin =
            await checkAdminStatus();


        if (isAdmin) {

            createPersonManagementControls(
                person
            );

        } else {

            removeAdminInterface();

        }


        const loading =
            document.getElementById(
                "person-loading"
            );


        const profile =
            document.getElementById(
                "person-profile"
            );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (profile) {

            profile.style.display =
                "block";

        }


        await Promise.all([

            loadPersonCases(personId),

            loadPersonMugshots(personId),

            loadPersonDocuments(personId),

            loadPersonSources(personId),

            loadPersonMentalHealth(personId)

        ]);

    } catch (error) {

        console.error(
            "Unexpected error loading person:",
            error
        );

        showError(
            "There was a problem loading this person."
        );

    }

}


// ============================================================
// Person Management Controls
// ============================================================

function createPersonManagementControls(person) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    removeAdminInterface();


    const profile =
        document.getElementById(
            "person-profile"
        );


    if (!profile) {

        return;

    }


    const controls =
        document.createElement(
            "div"
        );


    controls.id =
        "person-management-controls";


    controls.className =
        "cbra-admin-only";


    controls.style.marginBottom =
        "25px";


    // --------------------------------------------------------
    // Edit Person
    // --------------------------------------------------------

    const editPersonButton =
        document.createElement(
            "button"
        );


    editPersonButton.type =
        "button";


    editPersonButton.textContent =
        "Edit Person";


    editPersonButton.addEventListener(
        "click",
        function() {

            if (!CBRA_IS_ADMIN) {

                return;

            }


            showEditPersonForm(
                person
            );

        }
    );


    controls.appendChild(
        editPersonButton
    );


    // --------------------------------------------------------
    // Add Mugshot
    // --------------------------------------------------------

    const mugshotButton =
        document.createElement(
            "button"
        );


    mugshotButton.type =
        "button";


    mugshotButton.textContent =
        "Add Mugshot";


    mugshotButton.style.marginLeft =
        "8px";


    mugshotButton.addEventListener(
        "click",
        function() {

            if (!CBRA_IS_ADMIN) {

                return;

            }


            showMugshotForm();

        }
    );


    controls.appendChild(
        mugshotButton
    );


    // --------------------------------------------------------
    // Add Mental Health Document
    // --------------------------------------------------------

    const mentalButton =
        document.createElement(
            "button"
        );


    mentalButton.type =
        "button";


    mentalButton.textContent =
        "Add Behavioral / Mental Health Document";


    mentalButton.style.marginLeft =
        "8px";


    mentalButton.addEventListener(
        "click",
        function() {

            if (!CBRA_IS_ADMIN) {

                return;

            }


            showMentalHealthDocumentForm();

        }
    );


    controls.appendChild(
        mentalButton
    );


    // --------------------------------------------------------
    // Add Source
    // --------------------------------------------------------

    const sourceButton =
        document.createElement(
            "button"
        );


    sourceButton.type =
        "button";


    sourceButton.textContent =
        "Add Source";


    sourceButton.style.marginLeft =
        "8px";


    sourceButton.addEventListener(
        "click",
        function() {

            if (!CBRA_IS_ADMIN) {

                return;

            }


            showSourceForm();

        }
    );


    controls.appendChild(
        sourceButton
    );


    profile.insertBefore(
        controls,
        profile.firstChild
    );

}


// ============================================================
// Edit Person Form
// ============================================================

function showEditPersonForm(person) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const existingForm =
        document.getElementById(
            "edit-person-form"
        );


    if (existingForm) {

        existingForm.remove();

        return;

    }


    const form =
        document.createElement(
            "form"
        );


    form.id =
        "edit-person-form";


    form.style.marginBottom =
        "30px";


    form.innerHTML = `

        <h2>Edit Person</h2>

        <p>
            Update the person's basic information.
        </p>

        <label for="edit-person-name">
            <strong>Name</strong>
        </label>

        <br>

        <input
            type="text"
            id="edit-person-name"
            value="${escapeHtml(
                person.display_name || ""
            )}"
            required
        >

        <br><br>

        <label for="edit-person-age">
            <strong>Age at Case</strong>
        </label>

        <br>

        <input
            type="number"
            id="edit-person-age"
            min="0"
            value="${
                person.age_at_case !== null &&
                person.age_at_case !== undefined
                    ? escapeHtml(
                        person.age_at_case
                    )
                    : ""
            }"
        >

        <br><br>

        <label for="edit-person-dob">
            <strong>Date of Birth</strong>
        </label>

        <br>

        <input
            type="date"
            id="edit-person-dob"
            value="${escapeHtml(
                person.date_of_birth || ""
            )}"
        >

        <br><br>

        <label for="edit-person-gender">
            <strong>Gender</strong>
        </label>

        <br>

        <input
            type="text"
            id="edit-person-gender"
            value="${escapeHtml(
                person.gender || ""
            )}"
        >

        <br><br>

        <button type="submit">
            Save Changes
        </button>

        <button
            type="button"
            id="cancel-edit-person"
        >
            Cancel
        </button>

        <p id="edit-person-message"></p>

    `;


    const profile =
        document.getElementById(
            "person-profile"
        );


    const controls =
        document.getElementById(
            "person-management-controls"
        );


    if (
        !profile ||
        !controls ||
        !CBRA_IS_ADMIN
    ) {

        return;

    }


    profile.insertBefore(
        form,
        controls.nextSibling
    );


    form.addEventListener(
        "submit",
        function(event) {

            savePersonChanges(
                event,
                person.id
            );

        }
    );


    document
        .getElementById(
            "cancel-edit-person"
        )
        .addEventListener(
            "click",
            function() {

                form.remove();

            }
        );

}


// ============================================================
// Save Person Changes
// ============================================================

async function savePersonChanges(
    event,
    personId
) {

    event.preventDefault();


    if (!CBRA_IS_ADMIN) {

        return;

    }


    const nameElement =
        document.getElementById(
            "edit-person-name"
        );


    const ageElement =
        document.getElementById(
            "edit-person-age"
        );


    const dobElement =
        document.getElementById(
            "edit-person-dob"
        );


    const genderElement =
        document.getElementById(
            "edit-person-gender"
        );


    const message =
        document.getElementById(
            "edit-person-message"
        );


    if (
        !nameElement ||
        !ageElement ||
        !dobElement ||
        !genderElement ||
        !message
    ) {

        return;

    }


    const name =
        nameElement.value.trim();


    const ageValue =
        ageElement.value.trim();


    const dobValue =
        dobElement.value;


    const genderValue =
        genderElement.value.trim();


    if (!name) {

        message.textContent =
            "Name is required.";

        message.style.color =
            "red";

        return;

    }


    const updatedPerson = {

        display_name:
            name,

        age_at_case:
            ageValue !== ""
                ? Number(ageValue)
                : null,

        date_of_birth:
            dobValue !== ""
                ? dobValue
                : null,

        gender:
            genderValue !== ""
                ? genderValue
                : null

    };


    const {
        error
    } =
        await supabaseClient
            .from("people")
            .update(
                updatedPerson
            )
            .eq(
                "id",
                personId
            );


    if (error) {

        console.error(
            "Error updating person:",
            error
        );

        message.textContent =
            "Could not save changes: " +
            error.message;

        message.style.color =
            "red";

        return;

    }


    message.textContent =
        "Person information saved.";

    message.style.color =
        "green";


    setTimeout(
        function() {

            loadPerson();

        },
        500
    );

}


// ============================================================
// Load Cases
// ============================================================

async function loadPersonCases(personId) {

    const container =
        document.getElementById(
            "person-cases"
        );


    if (!container) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_people")
            .select(`
                role,
                case:cases (
                    id,
                    case_name,
                    case_date,
                    city,
                    state_province,
                    country,
                    offense,
                    classification,
                    outcome
                )
            `)
            .eq(
                "person_id",
                personId
            );


    if (error) {

        console.error(
            "Error loading person's cases:",
            error
        );

        container.innerHTML =
            "<p>Unable to load cases.</p>";

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "<p>No cases have been linked to this person.</p>";

        return;

    }


    container.innerHTML =
        "";


    data.forEach(
        connection => {

            const caseData =
                connection.case;


            if (!caseData) {

                return;

            }


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "person-case-card";


            const location = [

                caseData.city,

                caseData.state_province,

                caseData.country

            ]
                .filter(Boolean)
                .join(", ");


            article.innerHTML = `

                <h3>

                    <a
                        href="case.html?id=${encodeURIComponent(
                            caseData.id
                        )}"
                    >
                        ${escapeHtml(
                            caseData.case_name ||
                            "Unnamed Case"
                        )}
                    </a>

                </h3>

                ${
                    connection.role
                        ? `
                            <p>
                                <strong>Role:</strong>
                                ${escapeHtml(
                                    connection.role
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    caseData.case_date
                        ? `
                            <p>
                                <strong>Date:</strong>
                                ${formatDate(
                                    caseData.case_date
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    location
                        ? `
                            <p>
                                <strong>Location:</strong>
                                ${escapeHtml(
                                    location
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    caseData.offense
                        ? `
                            <p>
                                <strong>Offense:</strong>
                                ${escapeHtml(
                                    caseData.offense
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    caseData.classification
                        ? `
                            <p>
                                <strong>Classification:</strong>
                                ${escapeHtml(
                                    caseData.classification
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    caseData.outcome
                        ? `
                            <p>
                                <strong>Outcome:</strong>
                                ${escapeHtml(
                                    caseData.outcome
                                )}
                            </p>
                        `
                        : ""
                }

            `;


            container.appendChild(
                article
            );

        }
    );

}


// ============================================================
// Load Person Source Options
// ============================================================

async function loadPersonSourceOptions(
    personId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("person_sources")
            .select(`
                id,
                title
            `)
            .eq(
                "person_id",
                personId
            )
            .order(
                "title",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Error loading person source options:",
            error
        );

        return [];

    }


    return data || [];

}


// ============================================================
// Load Mugshot Source Options
// ============================================================

async function loadMugshotSourceOptions(
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
            "Error loading mugshot source options:",
            error
        );

        return [];

    }


    return (data || [])
        .map(
            row => row.source
        )
        .filter(Boolean)
        .sort(
            (a, b) =>
                (a.title || "")
                    .localeCompare(
                        b.title || ""
                    )
        );

}


// ============================================================
// Load Person Mugshots
// ============================================================

async function loadPersonMugshots(
    personId
) {

    const container =
        document.getElementById(
            "person-mugshots"
        );


    if (!container) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("person_mugshots")
            .select(`
                id,
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
                    ascending: true,
                    nullsFirst: false
                }
            );


    if (error) {

        console.error(
            "Error loading mugshots:",
            error
        );

        container.innerHTML =
            "<p>Unable to load mugshots.</p>";

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "<p>No mugshots available.</p>";

        return;

    }


    container.innerHTML =
        "";


    const gallery =
        document.createElement(
            "div"
        );


    gallery.className =
        "person-mugshot-gallery";


    data.forEach(
        mugshot => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "person-mugshot-card";


            card.innerHTML = `

                <a
                    href="${escapeHtml(
                        mugshot.image_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    <img
                        src="${escapeHtml(
                            mugshot.image_url
                        )}"
                        alt="${escapeHtml(
                            mugshot.title ||
                            "Mugshot"
                        )}"
                        loading="lazy"
                    >

                </a>

                ${
                    mugshot.title
                        ? `
                            <h3>
                                ${escapeHtml(
                                    mugshot.title
                                )}
                            </h3>
                        `
                        : ""
                }

                ${
                    mugshot.date_taken
                        ? `
                            <p>
                                <strong>Date:</strong>
                                ${formatDate(
                                    mugshot.date_taken
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    mugshot.description
                        ? `
                            <p>
                                ${escapeHtml(
                                    mugshot.description
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    CBRA_IS_ADMIN
                        ? `
                            <div class="cbra-admin-only">

                                <button
                                    type="button"
                                    onclick="editMugshot('${mugshot.id}')"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onclick="deleteMugshot('${mugshot.id}')"
                                >
                                    Delete
                                </button>

                            </div>
                        `
                        : ""
                }

            `;


            gallery.appendChild(
                card
            );

        }
    );


    container.appendChild(
        gallery
    );

}


// ============================================================
// Mugshot Form
// ============================================================

async function showMugshotForm(
    mugshot = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const existing =
        document.getElementById(
            "person-mugshot-form"
        );


    if (existing) {

        existing.remove();

    }


    const personId =
        getPersonId();


    const sources =
        await loadMugshotSourceOptions(
            personId
        );


    const form =
        document.createElement(
            "form"
        );


    form.id =
        "person-mugshot-form";


    form.className =
        "cbra-admin-only";


    form.style.marginBottom =
        "30px";


    const selectedSource =
        mugshot?.source_id || "";


    form.innerHTML = `

        <h3>
            ${
                mugshot
                    ? "Edit Mugshot"
                    : "Add Mugshot"
            }
        </h3>

        <label for="mugshot-title">
            <strong>Title</strong>
        </label>

        <br>

        <input
            type="text"
            id="mugshot-title"
            value="${escapeHtml(
                mugshot?.title || ""
            )}"
        >

        <br><br>

        <label for="mugshot-image">
            <strong>
                ${
                    mugshot
                        ? "Replace Image"
                        : "Image"
                }
            </strong>
        </label>

        <br>

        <input
            type="file"
            id="mugshot-image"
            accept="image/*"
            ${mugshot ? "" : "required"}
        >

        ${
            mugshot?.image_url
                ? `
                    <p>
                        <strong>Current Image:</strong>
                    </p>

                    <img
                        src="${escapeHtml(
                            mugshot.image_url
                        )}"
                        alt="Current mugshot"
                        style="
                            max-width: 250px;
                            max-height: 350px;
                            object-fit: contain;
                            display: block;
                            margin-bottom: 10px;
                        "
                    >

                    <p>
                        Choose a new file only if you want
                        to replace the current image.
                    </p>
                `
                : ""
        }

        <br>

        <label for="mugshot-date">
            <strong>Date Taken</strong>
        </label>

        <br>

        <input
            type="date"
            id="mugshot-date"
            value="${escapeHtml(
                mugshot?.date_taken || ""
            )}"
        >

        <br><br>

        <label for="mugshot-description">
            <strong>Description</strong>
        </label>

        <br>

        <textarea
            id="mugshot-description"
            rows="5"
        >${escapeHtml(
            mugshot?.description || ""
        )}</textarea>

        <br><br>

        <label for="mugshot-source">
            <strong>Source</strong>
        </label>

        <br>

        <select id="mugshot-source">

            <option value="">
                -- No Source --
            </option>

            ${sources.map(
                source => `
                    <option
                        value="${source.id}"
                        ${
                            String(source.id) ===
                            String(selectedSource)
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            source.title
                        )}
                    </option>
                `
            ).join("")}

        </select>

        <br><br>

        <button type="submit">
            ${
                mugshot
                    ? "Save Mugshot"
                    : "Add Mugshot"
            }
        </button>

        <button
            type="button"
            id="cancel-mugshot"
        >
            Cancel
        </button>

        <p id="mugshot-message"></p>

    `;


    const container =
        document.getElementById(
            "person-mugshots"
        );


    if (!container) {

        return;

    }


    container.prepend(
        form
    );


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            await saveMugshot(
                mugshot?.id || null
            );

        }
    );


    document
        .getElementById(
            "cancel-mugshot"
        )
        .addEventListener(
            "click",
            function() {

                form.remove();

            }
        );

}


// ============================================================
// Save Mugshot
// ============================================================

async function saveMugshot(
    mugshotId = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const personId =
        getPersonId();


    const titleElement =
        document.getElementById(
            "mugshot-title"
        );


    const imageElement =
        document.getElementById(
            "mugshot-image"
        );


    const dateElement =
        document.getElementById(
            "mugshot-date"
        );


    const descriptionElement =
        document.getElementById(
            "mugshot-description"
        );


    const sourceElement =
        document.getElementById(
            "mugshot-source"
        );


    const message =
        document.getElementById(
            "mugshot-message"
        );


    if (
        !titleElement ||
        !imageElement ||
        !dateElement ||
        !descriptionElement ||
        !sourceElement ||
        !message
    ) {

        return;

    }


    const title =
        titleElement.value.trim();


    const file =
        imageElement.files?.[0] || null;


    const dateTaken =
        dateElement.value;


    const description =
        descriptionElement.value.trim();


    const sourceId =
        sourceElement.value;


    if (
        !mugshotId &&
        !file
    ) {

        message.textContent =
            "Please choose an image file.";

        message.style.color =
            "red";

        return;

    }


    if (
        file &&
        !file.type.startsWith("image/")
    ) {

        message.textContent =
            "Please choose an image file.";

        message.style.color =
            "red";

        return;

    }


    if (
        file &&
        file.size > 10 * 1024 * 1024
    ) {

        message.textContent =
            "The image must be smaller than 10 MB.";

        message.style.color =
            "red";

        return;

    }


    message.textContent =
        file
            ? "Uploading image..."
            : "Saving mugshot...";


    let existingImageUrl =
        null;


    if (mugshotId) {

        const {
            data: existingMugshot,
            error: existingMugshotError
        } =
            await supabaseClient
                .from("person_mugshots")
                .select("image_url")
                .eq(
                    "id",
                    mugshotId
                )
                .single();


        if (existingMugshotError) {

            console.error(
                "Error loading existing mugshot:",
                existingMugshotError
            );

            message.textContent =
                "Could not load the existing mugshot: " +
                existingMugshotError.message;

            message.style.color =
                "red";

            return;

        }


        existingImageUrl =
            existingMugshot?.image_url ||
            null;

    }


    let imageUrl =
        existingImageUrl;


    if (file) {

        const originalName =
            file.name
                .toLowerCase()
                .replace(
                    /[^a-z0-9._-]/g,
                    "-"
                );


        const safeFileName =
            originalName ||
            "mugshot-image";


        const storagePath =
            `${personId}/${Date.now()}-${safeFileName}`;


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
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (uploadError) {

            console.error(
                "Error uploading mugshot image:",
                uploadError
            );

            message.textContent =
                "Could not upload image: " +
                uploadError.message;

            message.style.color =
                "red";

            return;

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


        imageUrl =
            publicUrlData?.publicUrl ||
            null;


        if (!imageUrl) {

            message.textContent =
                "The image uploaded, but CBRA could not get its URL.";

            message.style.color =
                "red";

            return;

        }

    }


    if (!imageUrl) {

        message.textContent =
            "No mugshot image is available.";

        message.style.color =
            "red";

        return;

    }


    const mugshotData = {

        person_id:
            personId,

        title:
            title || null,

        image_url:
            imageUrl,

        date_taken:
            dateTaken || null,

        description:
            description || null,

        source_id:
            sourceId || null

    };


    let error;


    if (mugshotId) {

        ({
            error
        } =
            await supabaseClient
                .from("person_mugshots")
                .update(
                    mugshotData
                )
                .eq(
                    "id",
                    mugshotId
                ));

    } else {

        ({
            error
        } =
            await supabaseClient
                .from("person_mugshots")
                .insert(
                    mugshotData
                ));

    }


    if (error) {

        console.error(
            "Error saving mugshot:",
            error
        );

        message.textContent =
            "Could not save mugshot: " +
            error.message;

        message.style.color =
            "red";

        return;

    }


    message.textContent =
        "Mugshot saved.";

    message.style.color =
        "green";


    setTimeout(
        function() {

            loadPersonMugshots(
                personId
            );

        },
        500
    );

}


// ============================================================
// Edit Mugshot
// ============================================================

async function editMugshot(
    mugshotId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


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
                "id",
                mugshotId
            )
            .single();


    if (error) {

        console.error(
            "Error loading mugshot:",
            error
        );

        alert(
            "Could not load mugshot."
        );

        return;

    }


    showMugshotForm(
        data
    );

}


// ============================================================
// Delete Mugshot
// ============================================================

async function deleteMugshot(
    mugshotId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (
        !confirm(
            "Delete this mugshot?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("person_mugshots")
            .delete()
            .eq(
                "id",
                mugshotId
            );


    if (error) {

        console.error(
            "Error deleting mugshot:",
            error
        );

        alert(
            "Could not delete mugshot: " +
            error.message
        );

        return;

    }


    await loadPersonMugshots(
        getPersonId()
    );

}


// ============================================================
// Load Person Documents
// ============================================================

async function loadPersonDocuments(
    personId
) {

    const container =
        document.getElementById(
            "person-documents"
        );


    if (!container) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("document_people")
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
                    source:sources (
                        id,
                        title
                    )
                )
            `)
            .eq(
                "person_id",
                personId
            );


    if (error) {

        console.error(
            "Error loading person documents:",
            error
        );

        container.innerHTML =
            "<p>Unable to load documents.</p>";

        return;

    }


    const documents =
        (data || [])
            .map(
                connection =>
                    connection.document
            )
            .filter(Boolean);


    if (documents.length === 0) {

        container.innerHTML =
            "<p>No court records or documents available.</p>";

        return;

    }


    container.innerHTML =
        "";


    documents.forEach(
        documentData => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "person-document-card";


            article.innerHTML = `

                <h3>

                    <a
                        href="${escapeHtml(
                            documentData.document_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${escapeHtml(
                            documentData.title ||
                            "Document"
                        )}
                    </a>

                </h3>

                ${
                    documentData.document_type
                        ? `
                            <p>
                                <strong>Type:</strong>
                                ${escapeHtml(
                                    documentData.document_type
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    documentData.publication_date
                        ? `
                            <p>
                                <strong>Date:</strong>
                                ${formatDate(
                                    documentData.publication_date
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    documentData.description
                        ? `
                            <p>
                                ${escapeHtml(
                                    documentData.description
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    documentData.source
                        ? `
                            <p>
                                <strong>Source:</strong>
                                ${escapeHtml(
                                    documentData.source.title
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    CBRA_IS_ADMIN
                        ? `
                            <div class="cbra-admin-only">

                                <button
                                    type="button"
                                    onclick="editPersonDocument('${documentData.id}')"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onclick="deletePersonDocument('${documentData.id}')"
                                >
                                    Delete
                                </button>

                            </div>
                        `
                        : ""
                }

            `;


            container.appendChild(
                article
            );

        }
    );

}


// ============================================================
// Person Document Form
// ============================================================

async function showDocumentForm(
    documentData = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const existing =
        document.getElementById(
            "person-document-form"
        );


    if (existing) {

        existing.remove();

    }


    const personId =
        getPersonId();


    const sources =
        await loadPersonSourceOptions(
            personId
        );


    const form =
        document.createElement(
            "form"
        );


    form.id =
        "person-document-form";


    form.className =
        "cbra-admin-only";


    form.style.marginBottom =
        "30px";


    form.innerHTML = `

        <h3>
            ${
                documentData
                    ? "Edit Court Record / Document"
                    : "Add Court Record / Document"
            }
        </h3>

        <label>
            <strong>Title</strong>
        </label>

        <br>

        <input
            type="text"
            id="person-document-title"
            value="${escapeHtml(
                documentData?.title || ""
            )}"
            required
        >

        <br><br>

        <label>
            <strong>Document URL</strong>
        </label>

        <br>

        <input
            type="url"
            id="person-document-url"
            value="${escapeHtml(
                documentData?.document_url || ""
            )}"
            required
        >

        <br><br>

        <label>
            <strong>Document Type</strong>
        </label>

        <br>

        <input
            type="text"
            id="person-document-type"
            placeholder="Court record, judgment, transcript, etc."
            value="${escapeHtml(
                documentData?.document_type || ""
            )}"
        >

        <br><br>

        <label>
            <strong>Publication Date</strong>
        </label>

        <br>

        <input
            type="date"
            id="person-document-date"
            value="${escapeHtml(
                documentData?.publication_date || ""
            )}"
        >

        <br><br>

        <label>
            <strong>Description</strong>
        </label>

        <br>

        <textarea
            id="person-document-description"
            rows="5"
        >${escapeHtml(
            documentData?.description || ""
        )}</textarea>

        <br><br>

        <label>
            <strong>Source</strong>
        </label>

        <br>

        <select id="person-document-source">

            <option value="">
                -- No Source --
            </option>

            ${sources.map(
                source => `
                    <option
                        value="${source.id}"
                        ${
                            String(source.id) ===
                            String(
                                documentData?.source_id || ""
                            )
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            source.title
                        )}
                    </option>
                `
            ).join("")}

        </select>

        <br><br>

        <button type="submit">
            ${
                documentData
                    ? "Save Document"
                    : "Add Document"
            }
        </button>

        <button
            type="button"
            id="cancel-person-document"
        >
            Cancel
        </button>

        <p id="person-document-message"></p>

    `;


    const container =
        document.getElementById(
            "person-documents"
        );


    if (!container) {

        return;

    }


    container.prepend(
        form
    );


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            await savePersonDocument(
                documentData?.id || null
            );

        }
    );


    document
        .getElementById(
            "cancel-person-document"
        )
        .addEventListener(
            "click",
            function() {

                form.remove();

            }
        );

}


// ============================================================
// Save Person Document
// ============================================================

async function savePersonDocument(
    documentId = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const personId =
        getPersonId();


    const titleElement =
        document.getElementById(
            "person-document-title"
        );


    const urlElement =
        document.getElementById(
            "person-document-url"
        );


    const typeElement =
        document.getElementById(
            "person-document-type"
        );


    const dateElement =
        document.getElementById(
            "person-document-date"
        );


    const descriptionElement =
        document.getElementById(
            "person-document-description"
        );


    const sourceElement =
        document.getElementById(
            "person-document-source"
        );


    const message =
        document.getElementById(
            "person-document-message"
        );


    if (
        !titleElement ||
        !urlElement ||
        !typeElement ||
        !dateElement ||
        !descriptionElement ||
        !sourceElement ||
        !message
    ) {

        return;

    }


    const title =
        titleElement.value.trim();


    const documentUrl =
        urlElement.value.trim();


    const documentType =
        typeElement.value.trim();


    const publicationDate =
        dateElement.value;


    const description =
        descriptionElement.value.trim();


    const sourceId =
        sourceElement.value;


    if (!title) {

        message.textContent =
            "Title is required.";

        message.style.color =
            "red";

        return;

    }


    if (!documentUrl) {

        message.textContent =
            "Document URL is required.";

        message.style.color =
            "red";

        return;

    }


    const documentRecord = {

        person_id:
            personId,

        title:
            title,

        document_url:
            documentUrl,

        document_type:
            documentType || null,

        publication_date:
            publicationDate || null,

        description:
            description || null,

        source_id:
            sourceId || null

    };


    let error;


    if (documentId) {

        ({
            error
        } =
            await supabaseClient
                .from("person_documents")
                .update(
                    documentRecord
                )
                .eq(
                    "id",
                    documentId
                ));

    } else {

        ({
            error
        } =
            await supabaseClient
                .from("person_documents")
                .insert(
                    documentRecord
                ));

    }


    if (error) {

        console.error(
            "Error saving person document:",
            error
        );

        message.textContent =
            "Could not save document: " +
            error.message;

        message.style.color =
            "red";

        return;

    }


    message.textContent =
        "Document saved.";

    message.style.color =
        "green";


    setTimeout(
        function() {

            loadPersonDocuments(
                personId
            );

        },
        500
    );

}


// ============================================================
// Edit Person Document
// ============================================================

async function editPersonDocument(
    documentId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("person_documents")
            .select(`
                id,
                person_id,
                title,
                document_url,
                document_type,
                publication_date,
                description,
                source_id
            `)
            .eq(
                "id",
                documentId
            )
            .single();


    if (error) {

        console.error(
            "Error loading person document:",
            error
        );

        alert(
            "Could not load document."
        );

        return;

    }


    showDocumentForm(
        data
    );

}


// ============================================================
// Delete Person Document
// ============================================================

async function deletePersonDocument(
    documentId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (
        !confirm(
            "Delete this document?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("person_documents")
            .delete()
            .eq(
                "id",
                documentId
            );


    if (error) {

        console.error(
            "Error deleting person document:",
            error
        );

        alert(
            "Could not delete document: " +
            error.message
        );

        return;

    }


    await loadPersonDocuments(
        getPersonId()
    );

}

// ============================================================
// Load Person Sources
// ============================================================

async function loadPersonSources(
    personId
) {

    const container =
        document.getElementById(
            "person-sources"
        );


    if (!container) {

        return;

    }


    // --------------------------------------------------------
    // IMPORTANT:
    // Sources connected to people are stored in
    // source_people.
    //
    // Do NOT use person_sources here.
    // --------------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("source_people")
            .select(`
                id,
                source_id,
                person_id,
                source:sources (
                    id,
                    title,
                    url,
                    source_type,
                    publication_date
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

        container.innerHTML =
            "<p>Unable to load sources.</p>";

        return;

    }


    // --------------------------------------------------------
    // Convert source_people rows into source records
    // --------------------------------------------------------

    const sources =
        (data || [])
            .map(
                connection =>
                    connection.source
            )
            .filter(Boolean);


    // --------------------------------------------------------
    // Remove duplicate sources just in case
    // --------------------------------------------------------

    const uniqueSources =
        Array.from(
            new Map(
                sources.map(
                    source => [
                        String(source.id),
                        source
                    ]
                )
            ).values()
        );


    // --------------------------------------------------------
    // Sort newest publication date first
    // --------------------------------------------------------

    uniqueSources.sort(
        function(a, b) {

            const dateA =
                a.publication_date
                    ? new Date(
                        a.publication_date
                    ).getTime()
                    : 0;


            const dateB =
                b.publication_date
                    ? new Date(
                        b.publication_date
                    ).getTime()
                    : 0;


            return dateB - dateA;

        }
    );


    // --------------------------------------------------------
    // Nothing found
    // --------------------------------------------------------

    if (
        uniqueSources.length === 0
    ) {

        container.innerHTML =
            "<p>No person-specific sources available.</p>";

        return;

    }


    // --------------------------------------------------------
    // Display sources
    // --------------------------------------------------------

    container.innerHTML =
        "";


    uniqueSources.forEach(
        function(source) {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "person-source-card";


            article.innerHTML = `

                <h3>

                    <a
                        href="${escapeHtml(
                            source.url || "#"
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${escapeHtml(
                            source.title ||
                            "Source"
                        )}
                    </a>

                </h3>

                ${
                    source.source_type
                        ? `
                            <p>
                                <strong>Type:</strong>
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
                                <strong>Date:</strong>
                                ${formatDate(
                                    source.publication_date
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    CBRA_IS_ADMIN
                        ? `
                            <div class="cbra-admin-only">

                                <button
                                    type="button"
                                    onclick="editPersonSource('${source.id}')"
                                >
                                    Edit
                                </button>

                            </div>
                        `
                        : ""
                }

            `;


            container.appendChild(
                article
            );

        }
    );

}

// ============================================================
// Source Form
// ============================================================

async function showSourceForm(
    sourceData = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const existing =
        document.getElementById(
            "person-source-form"
        );


    if (existing) {

        existing.remove();

    }


    const form =
        document.createElement(
            "form"
        );


    form.id =
        "person-source-form";


    form.className =
        "cbra-admin-only";


    form.style.marginBottom =
        "30px";


    form.innerHTML = `

        <h3>
            ${
                sourceData
                    ? "Edit Source"
                    : "Add Source"
            }
        </h3>

        <label>
            <strong>Title</strong>
        </label>

        <br>

        <input
            type="text"
            id="person-source-title"
            value="${escapeHtml(
                sourceData?.title || ""
            )}"
            required
        >

        <br><br>

        <label>
            <strong>URL</strong>
        </label>

        <br>

        <input
            type="url"
            id="person-source-url"
            value="${escapeHtml(
                sourceData?.url || ""
            )}"
            required
        >

        <br><br>

        <label>
            <strong>Source Type</strong>
        </label>

        <br>

        <input
            type="text"
            id="person-source-type"
            placeholder="News article, court record, government report, etc."
            value="${escapeHtml(
                sourceData?.source_type || ""
            )}"
        >

        <br><br>

        <label>
            <strong>Publication Date</strong>
        </label>

        <br>

        <input
            type="date"
            id="person-source-date"
            value="${escapeHtml(
                sourceData?.publication_date || ""
            )}"
        >

        <br><br>

        <button type="submit">
            ${
                sourceData
                    ? "Save Source"
                    : "Add Source"
            }
        </button>

        <button
            type="button"
            id="cancel-person-source"
        >
            Cancel
        </button>

        <p id="person-source-message"></p>

    `;


    const container =
        document.getElementById(
            "person-sources"
        );


    if (!container) {

        return;

    }


    container.prepend(
        form
    );


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            await savePersonSource(
                sourceData?.id || null
            );

        }
    );


    document
        .getElementById(
            "cancel-person-source"
        )
        .addEventListener(
            "click",
            function() {

                form.remove();

            }
        );

}


// ============================================================
// Save Person Source
// ============================================================

async function savePersonSource(
    sourceId = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const personId =
        getPersonId();


    const titleElement =
        document.getElementById(
            "person-source-title"
        );


    const urlElement =
        document.getElementById(
            "person-source-url"
        );


    const typeElement =
        document.getElementById(
            "person-source-type"
        );


    const dateElement =
        document.getElementById(
            "person-source-date"
        );


    const message =
        document.getElementById(
            "person-source-message"
        );


    if (
        !titleElement ||
        !urlElement ||
        !typeElement ||
        !dateElement ||
        !message
    ) {

        return;

    }


    const title =
        titleElement.value.trim();


    const url =
        urlElement.value.trim();


    const sourceType =
        typeElement.value.trim();


    const publicationDate =
        dateElement.value;


    if (!title) {

        message.textContent =
            "Source title is required.";

        message.style.color =
            "red";

        return;

    }


    if (!url) {

        message.textContent =
            "Source URL is required.";

        message.style.color =
            "red";

        return;

    }


    const sourceData = {

        person_id:
            personId,

        title:
            title,

        url:
            url,

        source_type:
            sourceType || null,

        publication_date:
            publicationDate || null

    };


    let error;


    if (sourceId) {

        ({
            error
        } =
            await supabaseClient
                .from("person_sources")
                .update(
                    sourceData
                )
                .eq(
                    "id",
                    sourceId
                ));

    } else {

        ({
            error
        } =
            await supabaseClient
                .from("person_sources")
                .insert(
                    sourceData
                ));

    }


    if (error) {

        console.error(
            "Error saving person source:",
            error
        );

        message.textContent =
            "Could not save source: " +
            error.message;

        message.style.color =
            "red";

        return;

    }


    message.textContent =
        "Source saved.";

    message.style.color =
        "green";


    setTimeout(
        function() {

            loadPersonSources(
                personId
            );

        },
        500
    );

}


// ============================================================
// Edit Person Source
// ============================================================

async function editPersonSource(
    sourceId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("person_sources")
            .select(`
                id,
                person_id,
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


    if (error) {

        console.error(
            "Error loading source:",
            error
        );

        alert(
            "Could not load source."
        );

        return;

    }


    showSourceForm(
        data
    );

}


// ============================================================
// Delete Person Source
// ============================================================

async function deletePersonSource(
    sourceId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (
        !confirm(
            "Delete this source?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("person_sources")
            .delete()
            .eq(
                "id",
                sourceId
            );


    if (error) {

        console.error(
            "Error deleting source:",
            error
        );

        alert(
            "Could not delete source: " +
            error.message
        );

        return;

    }


    await loadPersonSources(
        getPersonId()
    );

}


// ============================================================
// Load Mental Health / Behavioral Documents
// ============================================================

async function loadPersonMentalHealth(
    personId
) {

    const container =
        document.getElementById(
            "person-mental-health"
        );


    if (!container) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("mental_health_documents")
            .select(`
                id,
                case_id,
                title,
                document_url,
                document_type,
                publication_date,
                description,
                source_id,
                person_id
            `)
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
            "Error loading mental health documents:",
            error
        );

        container.innerHTML =
            "<p>Unable to load behavioral or mental health documents.</p>";

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            "<p>No mental health or behavioral information available.</p>";

        return;

    }


    container.innerHTML =
        "";


    data.forEach(
        documentData => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "person-mental-health-card";


            article.innerHTML = `

                <h3>

                    <a
                        href="${escapeHtml(
                            documentData.document_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${escapeHtml(
                            documentData.title ||
                            "Behavioral / Mental Health Document"
                        )}
                    </a>

                </h3>

                ${
                    documentData.document_type
                        ? `
                            <p>
                                <strong>Type:</strong>
                                ${escapeHtml(
                                    documentData.document_type
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    documentData.publication_date
                        ? `
                            <p>
                                <strong>Date:</strong>
                                ${formatDate(
                                    documentData.publication_date
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    documentData.description
                        ? `
                            <p>
                                ${escapeHtml(
                                    documentData.description
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    CBRA_IS_ADMIN
                        ? `
                            <div class="cbra-admin-only">

                                <button
                                    type="button"
                                    onclick="editMentalHealthDocument('${documentData.id}')"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onclick="deleteMentalHealthDocument('${documentData.id}')"
                                >
                                    Delete
                                </button>

                            </div>
                        `
                        : ""
                }

            `;


            container.appendChild(
                article
            );

        }
    );

}


// ============================================================
// Get Person's Cases For Mental Health Document
// ============================================================

async function getPersonCasesForDropdown(
    personId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_people")
            .select(`
                case_id,
                case:cases (
                    id,
                    case_name
                )
            `)
            .eq(
                "person_id",
                personId
            );


    if (error) {

        console.error(
            "Error loading person's cases:",
            error
        );

        return [];

    }


    return data || [];

}


// ============================================================
// Mental Health Document Form
// ============================================================

async function showMentalHealthDocumentForm(
    documentData = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const existing =
        document.getElementById(
            "mental-health-document-form"
        );


    if (existing) {

        existing.remove();

    }


    const personId =
        getPersonId();


    const cases =
        await getPersonCasesForDropdown(
            personId
        );


    const sources =
        await loadPersonSourceOptions(
            personId
        );


    const form =
        document.createElement(
            "form"
        );


    form.id =
        "mental-health-document-form";


    form.className =
        "cbra-admin-only";


    form.style.marginBottom =
        "30px";


    form.innerHTML = `

        <h3>
            ${
                documentData
                    ? "Edit Behavioral / Mental Health Document"
                    : "Add Behavioral / Mental Health Document"
            }
        </h3>

        <label>
            <strong>Related Case</strong>
        </label>

        <br>

        <select id="mental-health-case">

            <option value="">
                -- Select Case --
            </option>

            ${cases.map(
                connection => {

                    const caseData =
                        connection.case;


                    if (!caseData) {

                        return "";

                    }


                    return `
                        <option
                            value="${caseData.id}"
                            ${
                                String(caseData.id) ===
                                String(
                                    documentData?.case_id || ""
                                )
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escapeHtml(
                                caseData.case_name
                            )}
                        </option>
                    `;

                }
            ).join("")}

        </select>

        <br><br>

        <label>
            <strong>Title</strong>
        </label>

        <br>

        <input
            type="text"
            id="mental-health-title"
            value="${escapeHtml(
                documentData?.title || ""
            )}"
            required
        >

        <br><br>

        <label>
            <strong>Document URL</strong>
        </label>

        <br>

        <input
            type="url"
            id="mental-health-url"
            value="${escapeHtml(
                documentData?.document_url || ""
            )}"
            required
        >

        <br><br>

        <label>
            <strong>Document Type</strong>
        </label>

        <br>

        <input
            type="text"
            id="mental-health-type"
            placeholder="Assessment, court record, report, etc."
            value="${escapeHtml(
                documentData?.document_type || ""
            )}"
        >

        <br><br>

        <label>
            <strong>Publication Date</strong>
        </label>

        <br>

        <input
            type="date"
            id="mental-health-date"
            value="${escapeHtml(
                documentData?.publication_date || ""
            )}"
        >

        <br><br>

        <label>
            <strong>Description / Research Notes</strong>
        </label>

        <br>

        <textarea
            id="mental-health-description"
            rows="6"
        >${escapeHtml(
            documentData?.description || ""
        )}</textarea>

        <br><br>

        <label>
            <strong>Source</strong>
        </label>

        <br>

        <select id="mental-health-source">

            <option value="">
                -- No Source --
            </option>

            ${sources.map(
                source => `
                    <option
                        value="${source.id}"
                        ${
                            String(source.id) ===
                            String(
                                documentData?.source_id || ""
                            )
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(
                            source.title
                        )}
                    </option>
                `
            ).join("")}

        </select>

        <br><br>

        <button type="submit">
            ${
                documentData
                    ? "Save Document"
                    : "Add Document"
            }
        </button>

        <button
            type="button"
            id="cancel-mental-health"
        >
            Cancel
        </button>

        <p id="mental-health-message"></p>

    `;


    const container =
        document.getElementById(
            "person-mental-health"
        );


    if (!container) {

        return;

    }


    container.prepend(
        form
    );


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            await saveMentalHealthDocument(
                documentData?.id || null
            );

        }
    );


    document
        .getElementById(
            "cancel-mental-health"
        )
        .addEventListener(
            "click",
            function() {

                form.remove();

            }
        );

}


// ============================================================
// Save Mental Health Document
// ============================================================

async function saveMentalHealthDocument(
    documentId = null
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const personId =
        getPersonId();


    const caseElement =
        document.getElementById(
            "mental-health-case"
        );


    const titleElement =
        document.getElementById(
            "mental-health-title"
        );


    const urlElement =
        document.getElementById(
            "mental-health-url"
        );


    const typeElement =
        document.getElementById(
            "mental-health-type"
        );


    const dateElement =
        document.getElementById(
            "mental-health-date"
        );


    const descriptionElement =
        document.getElementById(
            "mental-health-description"
        );


    const sourceElement =
        document.getElementById(
            "mental-health-source"
        );


    const message =
        document.getElementById(
            "mental-health-message"
        );


    if (
        !caseElement ||
        !titleElement ||
        !urlElement ||
        !typeElement ||
        !dateElement ||
        !descriptionElement ||
        !sourceElement ||
        !message
    ) {

        return;

    }


    const caseId =
        caseElement.value;


    const title =
        titleElement.value.trim();


    const documentUrl =
        urlElement.value.trim();


    const documentType =
        typeElement.value.trim();


    const publicationDate =
        dateElement.value;


    const description =
        descriptionElement.value.trim();


    const sourceId =
        sourceElement.value;


    if (!title) {

        message.textContent =
            "Title is required.";

        message.style.color =
            "red";

        return;

    }


    if (!documentUrl) {

        message.textContent =
            "Document URL is required.";

        message.style.color =
            "red";

        return;

    }


    const record = {

        person_id:
            personId,

        case_id:
            caseId || null,

        title:
            title,

        document_url:
            documentUrl,

        document_type:
            documentType || null,

        publication_date:
            publicationDate || null,

        description:
            description || null,

        source_id:
            sourceId || null

    };


    let error;


    if (documentId) {

        ({
            error
        } =
            await supabaseClient
                .from(
                    "mental_health_documents"
                )
                .update(
                    record
                )
                .eq(
                    "id",
                    documentId
                ));

    } else {

        ({
            error
        } =
            await supabaseClient
                .from(
                    "mental_health_documents"
                )
                .insert(
                    record
                ));

    }


    if (error) {

        console.error(
            "Error saving mental health document:",
            error
        );

        message.textContent =
            "Could not save document: " +
            error.message;

        message.style.color =
            "red";

        return;

    }


    message.textContent =
        "Document saved.";

    message.style.color =
        "green";


    setTimeout(
        function() {

            loadPersonMentalHealth(
                personId
            );

        },
        500
    );

}


// ============================================================
// Edit Mental Health Document
// ============================================================

async function editMentalHealthDocument(
    documentId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "mental_health_documents"
            )
            .select(`
                id,
                case_id,
                title,
                document_url,
                document_type,
                publication_date,
                description,
                source_id,
                person_id
            `)
            .eq(
                "id",
                documentId
            )
            .single();


    if (error) {

        console.error(
            "Error loading mental health document:",
            error
        );

        alert(
            "Could not load document."
        );

        return;

    }


    showMentalHealthDocumentForm(
        data
    );

}


// ============================================================
// Delete Mental Health Document
// ============================================================

async function deleteMentalHealthDocument(
    documentId
) {

    if (!CBRA_IS_ADMIN) {

        return;

    }


    if (
        !confirm(
            "Delete this behavioral / mental health document?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "mental_health_documents"
            )
            .delete()
            .eq(
                "id",
                documentId
            );


    if (error) {

        console.error(
            "Error deleting mental health document:",
            error
        );

        alert(
            "Could not delete document: " +
            error.message
        );

        return;

    }


    await loadPersonMentalHealth(
        getPersonId()
    );

}


// ============================================================
// Make Functions Available To HTML Buttons
// ============================================================

window.editMugshot =
    editMugshot;

window.deleteMugshot =
    deleteMugshot;

window.editPersonDocument =
    editPersonDocument;

window.deletePersonDocument =
    deletePersonDocument;

window.editPersonSource =
    editPersonSource;

window.deletePersonSource =
    deletePersonSource;

window.editMentalHealthDocument =
    editMentalHealthDocument;

window.deleteMentalHealthDocument =
    deleteMentalHealthDocument;

window.logoutAdmin =
    logoutAdmin;


// ============================================================
// Start Page
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        await checkAdminStatus();

        await loadPerson();

    }
);