/* =========================================
   CBRA — CRIME SCENE PHOTOS
   ========================================= */


/* -----------------------------------------
   LOAD CRIME SCENE PHOTOS
   ----------------------------------------- */

async function loadCrimeScenePhotos(caseId) {

    const list =
        document.getElementById(
            "crime-scene-photo-list"
        );

    if (!list) {
        return;
    }

    if (!caseId) {

        list.innerHTML =
            '<p class="empty-message">Select a case to view its photographs.</p>';

        return;
    }

    list.innerHTML =
        "<p>Loading crime scene photos...</p>";

    try {

        const { data, error } =
            await supabaseClient
                .from("case_crime_scene_photos")
                .select(`
                    *,
                    sources (
                        id,
                        title
                    )
                `)
                .eq(
                    "case_id",
                    caseId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        list.innerHTML = "";

        if (
            !data ||
            data.length === 0
        ) {

            list.innerHTML =
                '<p class="empty-message">No crime scene photos added yet.</p>';

            return;
        }


        data.forEach(
            function (photo) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "manage-record";


                /* TITLE */

                const title =
                    document.createElement(
                        "strong"
                    );

                title.textContent =
                    photo.title ||
                    "Untitled photo";

                card.appendChild(
                    title
                );


                /* IMAGE */

                if (photo.image_url) {

                    const image =
                        document.createElement(
                            "img"
                        );

                    image.src =
                        photo.image_url;

                    image.alt =
                        photo.title ||
                        "Crime scene photograph";

                    image.style.maxWidth =
                        "300px";

                    image.style.display =
                        "block";

                    image.style.margin =
                        "12px 0";

                    card.appendChild(
                        image
                    );
                }


                /* DATE */

                if (photo.date_taken) {

                    const date =
                        document.createElement(
                            "p"
                        );

                    date.textContent =
                        "Date taken: " +
                        photo.date_taken;

                    card.appendChild(
                        date
                    );
                }


                /* DESCRIPTION */

                if (photo.description) {

                    const description =
                        document.createElement(
                            "p"
                        );

                    description.textContent =
                        photo.description;

                    card.appendChild(
                        description
                    );
                }


                /* SOURCE */

                if (
                    photo.sources &&
                    photo.sources.title
                ) {

                    const source =
                        document.createElement(
                            "p"
                        );

                    source.textContent =
                        "Source: " +
                        photo.sources.title;

                    card.appendChild(
                        source
                    );
                }


                /* OPEN FULL IMAGE */

                if (photo.image_url) {

                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href =
                        photo.image_url;

                    link.target =
                        "_blank";

                    link.rel =
                        "noopener noreferrer";

                    link.textContent =
                        "Open Full Image";

                    card.appendChild(
                        link
                    );
                }


                /* REMOVE */

                const remove =
                    document.createElement(
                        "button"
                    );

                remove.type =
                    "button";

                remove.textContent =
                    "Remove";

                remove.onclick =
                    function () {

                        removeCrimeScenePhoto(
                            photo.id
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

    } catch (error) {

        console.error(
            "Crime scene photo loading error:",
            error
        );

        list.innerHTML =
            "<p>Unable to load crime scene photos.</p>";

    }

}


/* -----------------------------------------
   ADD CRIME SCENE PHOTO
   ----------------------------------------- */

async function addCrimeScenePhoto(event) {

    event.preventDefault();


    /* -----------------------------------------
       GET CURRENT CASE
       ----------------------------------------- */

    const caseId =
        window.getCurrentCaseId();


    /* -----------------------------------------
       GET FORM MESSAGE
       ----------------------------------------- */

    const message =
        document.getElementById(
            "crime-scene-photo-message"
        );


    if (!caseId) {

        if (message) {

            message.textContent =
                "Please select a case first.";

        }

        return;
    }


    /* -----------------------------------------
       GET TITLE
       ----------------------------------------- */

    const titleElement =
        document.getElementById(
            "crime-scene-photo-title"
        );


    if (!titleElement) {

        console.error(
            "Element not found: crime-scene-photo-title"
        );

        if (message) {

            message.textContent =
                "Crime scene photo title field could not be found.";

        }

        return;
    }


    const title =
        titleElement.value.trim();


    /* -----------------------------------------
       GET DATE
       ----------------------------------------- */

    const dateElement =
        document.getElementById(
            "crime-scene-photo-date"
        );


    const dateTaken =
        dateElement
            ? dateElement.value || null
            : null;


    /* -----------------------------------------
       GET IMAGE FILE
       ----------------------------------------- */

    const fileElement =
        document.getElementById(
            "crime-scene-photo-file"
        );


    if (!fileElement) {

        console.error(
            "Element not found: crime-scene-photo-file"
        );

        if (message) {

            message.textContent =
                "Crime scene photo file field could not be found.";

        }

        return;
    }


    const file =
        fileElement.files &&
        fileElement.files[0];


    /* -----------------------------------------
       GET DESCRIPTION
       ----------------------------------------- */

    const descriptionElement =
        document.getElementById(
            "crime-scene-photo-description"
        );


    const description =
        descriptionElement
            ? descriptionElement.value.trim() || null
            : null;


    /* -----------------------------------------
       GET SOURCE
       ----------------------------------------- */

    const sourceElement =
        document.getElementById(
            "crime-scene-photo-source"
        );


    const sourceValue =
        sourceElement
            ? sourceElement.value
            : "";


    const sourceId =
        sourceValue
            ? Number(sourceValue)
            : null;


    /* -----------------------------------------
       VALIDATION
       ----------------------------------------- */

    if (!title) {

        if (message) {

            message.textContent =
                "Please enter a title.";

        }

        return;
    }


    if (!file) {

        if (message) {

            message.textContent =
                "Please select an image.";

        }

        return;
    }


    if (message) {

        message.textContent =
            "Uploading photograph...";

    }


    /* -----------------------------------------
       CREATE UNIQUE STORAGE FILENAME
       ----------------------------------------- */

    const fileExtension =
        file.name.includes(".")
            ? file.name
                .split(".")
                .pop()
                .toLowerCase()
            : "jpg";


    const fileName =
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10) +
        "." +
        fileExtension;


    const filePath =
        caseId +
        "/" +
        fileName;


    /* -----------------------------------------
       UPLOAD IMAGE
       ----------------------------------------- */

    try {

        const { error: uploadError } =
            await supabaseClient
                .storage
                .from(
                    "crime-scene-photos"
                )
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (uploadError) {

            console.error(
                "Crime scene photo upload error:",
                uploadError
            );

            if (message) {

                message.textContent =
                    "Unable to upload photograph.";

            }

            return;
        }


        /* -----------------------------------------
           GET PUBLIC URL
           ----------------------------------------- */

        const { data: publicData } =
            supabaseClient
                .storage
                .from(
                    "crime-scene-photos"
                )
                .getPublicUrl(
                    filePath
                );


        const imageUrl =
            publicData &&
            publicData.publicUrl;


        if (!imageUrl) {

            console.error(
                "Unable to create public image URL."
            );

            if (message) {

                message.textContent =
                    "The image uploaded, but its public URL could not be created.";

            }

            return;
        }


        /* -----------------------------------------
           SAVE DATABASE RECORD
           ----------------------------------------- */

        const { error: databaseError } =
            await supabaseClient
                .from(
                    "case_crime_scene_photos"
                )
                .insert({

                    case_id:
                        caseId,

                    title:
                        title,

                    image_url:
                        imageUrl,

                    date_taken:
                        dateTaken,

                    description:
                        description,

                    source_id:
                        sourceId

                });


        if (databaseError) {

            console.error(
                "Crime scene photo database error:",
                databaseError
            );

            if (message) {

                message.textContent =
                    "The image uploaded, but the database record could not be saved.";

            }

            return;
        }


        /* -----------------------------------------
           CLEAR FORM
           ----------------------------------------- */

        const form =
            document.getElementById(
                "crime-scene-photo-form"
            );


        if (form) {

            form.reset();

        }


        /* -----------------------------------------
           SUCCESS
           ----------------------------------------- */

        if (message) {

            message.textContent =
                "Crime scene photo added successfully.";

        }


        /* -----------------------------------------
           REFRESH LIST
           ----------------------------------------- */

        await loadCrimeScenePhotos(
            caseId
        );

    } catch (error) {

        console.error(
            "Crime scene photo error:",
            error
        );

        if (message) {

            message.textContent =
                error.message ||
                "Something went wrong while adding the photograph.";

        }

    }

}


/* -----------------------------------------
   REMOVE CRIME SCENE PHOTO
   ----------------------------------------- */

async function removeCrimeScenePhoto(id) {

    if (
        !confirm(
            "Remove this crime scene photo?"
        )
    ) {
        return;
    }


    /* -----------------------------------------
       GET PHOTO INFORMATION
       ----------------------------------------- */

    const {
        data: photo,
        error: fetchError
    } =
        await supabaseClient
            .from(
                "case_crime_scene_photos"
            )
            .select(
                "image_url"
            )
            .eq(
                "id",
                id
            )
            .single();


    if (
        fetchError ||
        !photo
    ) {

        console.error(
            "Unable to find crime scene photo:",
            fetchError
        );

        alert(
            "Unable to find the photograph."
        );

        return;
    }


    /* -----------------------------------------
       GET CURRENT CASE
       ----------------------------------------- */

    const caseId =
        window.getCurrentCaseId();


    /* -----------------------------------------
       DELETE DATABASE RECORD
       ----------------------------------------- */

    const {
        error: databaseError
    } =
        await supabaseClient
            .from(
                "case_crime_scene_photos"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (databaseError) {

        console.error(
            "Crime scene photo database deletion error:",
            databaseError
        );

        alert(
            "Unable to remove the photograph."
        );

        return;
    }


    /* -----------------------------------------
       DELETE IMAGE FROM STORAGE
       ----------------------------------------- */

    if (photo.image_url) {

        try {

            const bucketName =
                "crime-scene-photos";


            const marker =
                "/" +
                bucketName +
                "/";


            const markerIndex =
                photo.image_url.indexOf(
                    marker
                );


            if (
                markerIndex !== -1
            ) {

                const storagePath =
                    decodeURIComponent(
                        photo.image_url.substring(
                            markerIndex +
                            marker.length
                        )
                    );


                const {
                    error: storageError
                } =
                    await supabaseClient
                        .storage
                        .from(
                            bucketName
                        )
                        .remove([
                            storagePath
                        ]);


                if (storageError) {

                    console.error(
                        "Crime scene photo Storage deletion error:",
                        storageError
                    );

                    alert(
                        "The database record was removed, but the image file could not be deleted from Storage."
                    );

                    await loadCrimeScenePhotos(
                        caseId
                    );

                    return;
                }

            }

        } catch (storageException) {

            console.error(
                "Crime scene photo Storage deletion exception:",
                storageException
            );

            alert(
                "The database record was removed, but the image file could not be deleted from Storage."
            );

            await loadCrimeScenePhotos(
                caseId
            );

            return;
        }

    }


    /* -----------------------------------------
       REFRESH PHOTO LIST
       ----------------------------------------- */

    await loadCrimeScenePhotos(
        caseId
    );

}


/* -----------------------------------------
   LOAD SOURCES
   ----------------------------------------- */

async function loadCrimeScenePhotoSources(caseId) {

    const selector =
        document.getElementById(
            "crime-scene-photo-source"
        );


    if (!selector) {
        return;
    }


    selector.innerHTML =
        '<option value="">-- Select Source --</option>';


    if (!caseId) {
        return;
    }


    try {

        /*
           Sources are now connected to cases
           through source_cases.

           This allows the same source to be
           reused across multiple cases.
        */

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "source_cases"
                )
                .select(`
                    source_id,
                    source:sources (
                        id,
                        title
                    )
                `)
                .eq(
                    "case_id",
                    Number(caseId)
                );


        if (error) {

            throw error;

        }


        if (!data) {
            return;
        }


        const sources =
            data
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

                        return String(
                            a.title || ""
                        ).localeCompare(
                            String(
                                b.title || ""
                            )
                        );

                    }
                );


        sources.forEach(
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

                selector.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        console.error(
            "Crime scene source loading error:",
            error
        );

    }

}


/* -----------------------------------------
   FORM SUBMISSION
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const crimeSceneForm =
            document.getElementById(
                "crime-scene-photo-form"
            );


        if (crimeSceneForm) {

            crimeSceneForm.addEventListener(
                "submit",
                addCrimeScenePhoto
            );

        }

    }
);


/* -----------------------------------------
   MAKE FUNCTIONS AVAILABLE
   ----------------------------------------- */

window.loadCrimeScenePhotos =
    loadCrimeScenePhotos;

window.loadCrimeScenePhotoSources =
    loadCrimeScenePhotoSources;

window.addCrimeScenePhoto =
    addCrimeScenePhoto;

window.removeCrimeScenePhoto =
    removeCrimeScenePhoto;