const mugshotSupabase = window.supabaseClient;


// --------------------------------------------------
// MUGSHOTS
// --------------------------------------------------
// Mugshots belong to PEOPLE, not CASES.
//
// The database relationship is:
//
// people
//   ↓
// person_mugshots.person_id
//
// They will eventually be managed from person.html.
// --------------------------------------------------


// --------------------------------------------------
// LOAD MUGSHOTS
// --------------------------------------------------

async function loadMugshots(caseId) {

    /*
        Mugshots are intentionally NOT displayed on the
        case management page anymore.

        A person can potentially be connected to multiple
        cases, while their mugshots belong to that person.

        We therefore don't load mugshots by case.
    */

    const container =
        document.getElementById("mugshot-management");

    if (!container) {
        return;
    }


    container.innerHTML = `
        <p class="empty-message">
            Mugshots are managed from individual person profiles.
        </p>
    `;
}


// --------------------------------------------------
// LOAD MUGSHOTS FOR A PERSON
// --------------------------------------------------

async function loadPersonMugshots(personId) {

    const container =
        document.getElementById(
            "person-mugshot-list"
        );


    if (!container) {
        return;
    }


    if (!personId) {

        container.innerHTML = `
            <p class="empty-message">
                No person selected.
            </p>
        `;

        return;
    }


    const {
        data,
        error
    } = await mugshotSupabase
        .from("person_mugshots")
        .select(`
            id,
            title,
            image_url,
            date_taken,
            description,
            source_id
        `)
        .eq("person_id", personId)
        .order("date_taken", {
            ascending: true,
            nullsFirst: false
        });


    if (error) {

        console.error(
            "Error loading person mugshots:",
            error
        );


        container.innerHTML = `
            <p class="empty-message">
                Unable to load mugshots.
            </p>
        `;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No mugshots have been added for this person.
            </p>
        `;

        return;
    }


    container.innerHTML = data.map(mugshot => {

        return `
            <article class="mugshot-card">

                <div class="mugshot-image-wrapper">

                    <a
                        href="${escapeMugshotHTML(
                            mugshot.image_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >

                        <img
                            src="${escapeMugshotHTML(
                                mugshot.image_url
                            )}"
                            alt="${escapeMugshotHTML(
                                mugshot.title ||
                                "Mugshot"
                            )}"
                            loading="lazy"
                        >

                    </a>

                </div>


                <div class="mugshot-info">

                    <h3>
                        ${escapeMugshotHTML(
                            mugshot.title ||
                            "Untitled Mugshot"
                        )}
                    </h3>


                    ${
                        mugshot.date_taken
                            ? `
                                <p>
                                    <strong>Date:</strong>
                                    ${formatMugshotDate(
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
                                    ${escapeMugshotHTML(
                                        mugshot.description
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <button
                        type="button"
                        class="danger-button"
                        onclick="deleteMugshot('${mugshot.id}')"
                    >
                        Delete Mugshot
                    </button>

                </div>

            </article>
        `;

    }).join("");
}


// --------------------------------------------------
// ADD MUGSHOT
// --------------------------------------------------

async function addMugshot(event) {

    event.preventDefault();


    const personId =
        getMugshotValue(
            "mugshot-person-id"
        );


    if (!personId) {

        showMugshotMessage(
            "mugshot-message",
            "No person has been selected.",
            "error"
        );

        return;
    }


    const title =
        getMugshotValue(
            "mugshot-title"
        );


    const dateTaken =
        getMugshotValue(
            "mugshot-date"
        );


    const description =
        getMugshotValue(
            "mugshot-description"
        );


    const sourceId =
        getMugshotValue(
            "mugshot-source"
        );


    const fileInput =
        document.getElementById(
            "mugshot-image"
        );


    if (!fileInput || !fileInput.files.length) {

        showMugshotMessage(
            "mugshot-message",
            "Please select an image.",
            "error"
        );

        return;
    }


    const file =
        fileInput.files[0];


    showMugshotMessage(
        "mugshot-message",
        "Uploading mugshot..."
    );


    try {

        // Create a safe file name

        const safeFileName =
            file.name
                .toLowerCase()
                .replace(/[^a-z0-9._-]/g, "-");


        const filePath =
            `${personId}/${Date.now()}-${safeFileName}`;


        // Upload image

        const {
            error: uploadError
        } = await mugshotSupabase
            .storage
            .from("mugshots")
            .upload(
                filePath,
                file,
                {
                    upsert: false
                }
            );


        if (uploadError) {
            throw uploadError;
        }


        // Get public URL

        const {
            data: publicUrlData
        } = mugshotSupabase
            .storage
            .from("mugshots")
            .getPublicUrl(filePath);


        const imageUrl =
            publicUrlData.publicUrl;


        // Create database record

        const {
            error: insertError
        } = await mugshotSupabase
            .from("person_mugshots")
            .insert({
                person_id: personId,
                title: title || null,
                image_url: imageUrl,
                date_taken: dateTaken || null,
                description: description || null,
                source_id: sourceId || null
            });


        if (insertError) {
            throw insertError;
        }


        showMugshotMessage(
            "mugshot-message",
            "Mugshot added successfully.",
            "success"
        );


        clearMugshotForm();


        await loadPersonMugshots(
            personId
        );


    } catch (error) {

        console.error(
            "Error adding mugshot:",
            error
        );


        showMugshotMessage(
            "mugshot-message",
            `Unable to add mugshot: ${error.message}`,
            "error"
        );
    }
}


// --------------------------------------------------
// DELETE MUGSHOT
// --------------------------------------------------

async function deleteMugshot(mugshotId) {

    if (!mugshotId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Delete this mugshot?"
        );


    if (!confirmed) {
        return;
    }


    try {

        // First retrieve the image URL so that
        // we can attempt to remove the storage file.

        const {
            data: mugshot,
            error: fetchError
        } = await mugshotSupabase
            .from("person_mugshots")
            .select(`
                id,
                image_url,
                person_id
            `)
            .eq("id", mugshotId)
            .single();


        if (fetchError) {
            throw fetchError;
        }


        // Delete database record

        const {
            error: deleteError
        } = await mugshotSupabase
            .from("person_mugshots")
            .delete()
            .eq("id", mugshotId);


        if (deleteError) {
            throw deleteError;
        }


        // Attempt to remove the actual storage file.

        if (mugshot && mugshot.image_url) {

            const storagePath =
                getMugshotStoragePath(
                    mugshot.image_url
                );


            if (storagePath) {

                const {
                    error: storageError
                } = await mugshotSupabase
                    .storage
                    .from("mugshots")
                    .remove([
                        storagePath
                    ]);


                if (storageError) {

                    console.warn(
                        "Database record deleted, but storage file could not be removed:",
                        storageError
                    );
                }
            }
        }


        const personId =
            mugshot
                ? mugshot.person_id
                : null;


        if (personId) {

            await loadPersonMugshots(
                personId
            );
        }


    } catch (error) {

        console.error(
            "Error deleting mugshot:",
            error
        );


        showMugshotMessage(
            "mugshot-message",
            `Unable to delete mugshot: ${error.message}`,
            "error"
        );
    }
}


// --------------------------------------------------
// GET STORAGE PATH
// --------------------------------------------------

function getMugshotStoragePath(imageUrl) {

    if (!imageUrl) {
        return null;
    }


    try {

        const marker =
            "/storage/v1/object/public/mugshots/";


        const index =
            imageUrl.indexOf(marker);


        if (index === -1) {
            return null;
        }


        return imageUrl.substring(
            index + marker.length
        );

    } catch (error) {

        console.error(
            "Unable to determine storage path:",
            error
        );

        return null;
    }
}


// --------------------------------------------------
// CLEAR FORM
// --------------------------------------------------

function clearMugshotForm() {

    setMugshotValue(
        "mugshot-title",
        ""
    );

    setMugshotValue(
        "mugshot-date",
        ""
    );

    setMugshotValue(
        "mugshot-description",
        ""
    );

    setMugshotValue(
        "mugshot-source",
        ""
    );


    const fileInput =
        document.getElementById(
            "mugshot-image"
        );


    if (fileInput) {
        fileInput.value = "";
    }
}


// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getMugshotValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value.trim();
}


function setMugshotValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.value = value;
    }
}


function formatMugshotDate(date) {

    if (!date) {
        return "";
    }


    const parsed =
        new Date(date);


    if (Number.isNaN(
        parsed.getTime()
    )) {
        return escapeMugshotHTML(date);
    }


    return parsed.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


function escapeMugshotHTML(value) {

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


function showMugshotMessage(
    id,
    message,
    type = ""
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "form-message";


    if (type) {
        element.classList.add(type);
    }
}


// --------------------------------------------------
// EVENT LISTENER
// --------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const form =
            document.getElementById(
                "mugshot-form"
            );


        if (form) {

            form.addEventListener(
                "submit",
                addMugshot
            );
        }

    }
);


// --------------------------------------------------
// GLOBAL FUNCTIONS
// --------------------------------------------------

window.loadMugshots =
    loadMugshots;

window.loadPersonMugshots =
    loadPersonMugshots;

window.addMugshot =
    addMugshot;

window.deleteMugshot =
    deleteMugshot;

window.clearMugshotForm =
    clearMugshotForm;