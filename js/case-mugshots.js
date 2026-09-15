async function loadCaseMugshots() {

    const container =
        document.getElementById("case-mugshots");

    if (!container) {
        return;
    }

    const params =
        new URLSearchParams(window.location.search);

    const caseId =
        params.get("id");

    if (!caseId) {
        container.innerHTML =
            "<p>No case was selected.</p>";

        return;
    }


    // Find the people connected to this case

    const { data: casePeople, error: peopleError } =
        await supabaseClient
            .from("case_people")
            .select(`
                person_id,
                role,
                people (
                    id,
                    display_name
                )
            `)
            .eq("case_id", caseId);


    if (peopleError) {

        console.error(peopleError);

        container.innerHTML =
            "<p>Unable to load mugshots.</p>";

        return;
    }


    if (!casePeople || !casePeople.length) {

        container.innerHTML =
            "<p>No people have been added to this case.</p>";

        return;
    }


    const personIds =
        casePeople.map(person => person.person_id);


    // Find mugshots belonging to those people

    const { data: mugshots, error: mugshotError } =
        await supabaseClient
            .from("person_mugshots")
            .select(`
                id,
                person_id,
                title,
                image_url,
                date_taken,
                description,
                source_id,
                sources (
                    title
                )
            `)
            .in("person_id", personIds)
            .order("date_taken", {
                ascending: false,
                nullsFirst: false
            });


    if (mugshotError) {

        console.error(mugshotError);

        container.innerHTML =
            "<p>Unable to load mugshots.</p>";

        return;
    }


    if (!mugshots || !mugshots.length) {

        container.innerHTML =
            "<p>No mugshots have been added to this case.</p>";

        return;
    }


    container.innerHTML = "";


    // Group mugshots by person

    casePeople.forEach(casePerson => {

        const personMugshots =
            mugshots.filter(
                mugshot =>
                    String(mugshot.person_id) ===
                    String(casePerson.person_id)
            );


        if (!personMugshots.length) {
            return;
        }


        const personSection =
            document.createElement("div");

        personSection.className =
            "case-mugshot-person";


        const personName =
            document.createElement("h4");

        personName.textContent =
            casePerson.people?.display_name ||
            "Unknown person";


        personSection.appendChild(personName);


        if (casePerson.role) {

            const role =
                document.createElement("p");

            role.className =
                "case-mugshot-role";

            role.innerHTML =
                `<strong>Role:</strong> ${
                    escapeCaseMugshotHTML(
                        casePerson.role
                    )
                }`;

            personSection.appendChild(role);
        }


        const mugshotGrid =
            document.createElement("div");

        mugshotGrid.className =
            "case-mugshot-grid";


        personMugshots.forEach(mugshot => {

            const card =
                document.createElement("div");

            card.className =
                "case-mugshot-card";


            const image =
                document.createElement("img");

            image.src =
                mugshot.image_url;

            image.alt =
                `${casePerson.people?.display_name || "Person"} mugshot`;

            image.className =
                "case-mugshot-image";


            card.appendChild(image);


            const title =
                document.createElement("h5");

            title.textContent =
                mugshot.title || "Mugshot";


            card.appendChild(title);


            if (mugshot.date_taken) {

                const date =
                    document.createElement("p");

                date.className =
                    "case-mugshot-date";

                date.innerHTML =
                    `<strong>Date:</strong> ${
                        escapeCaseMugshotHTML(
                            mugshot.date_taken
                        )
                    }`;

                card.appendChild(date);
            }


            if (mugshot.description) {

                const description =
                    document.createElement("p");

                description.textContent =
                    mugshot.description;

                card.appendChild(description);
            }


            if (mugshot.sources) {

                const source =
                    document.createElement("p");

                source.className =
                    "case-mugshot-source";

                source.innerHTML =
                    `<strong>Source:</strong> ${
                        escapeCaseMugshotHTML(
                            mugshot.sources.title
                        )
                    }`;

                card.appendChild(source);
            }


            mugshotGrid.appendChild(card);
        });


        personSection.appendChild(
            mugshotGrid
        );

        container.appendChild(
            personSection
        );
    });
}


function escapeCaseMugshotHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCaseMugshots();

    }
);