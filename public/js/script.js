const userContainer = document.getElementById("users-container");

//Grab users
const fetchUsers = async ()=>{
    try{
        //fetch data from server
        const response = await fetch("/people"); //pass route
        if(!response.ok){
            throw new Error("Failed to get users");
        }

        //Parse JSON
        const users = await response.json();

        //Format the data to HTML
        userContainer.innerHTML = ""; //clear it

        users.forEach((user) => {
            const userDiv = document.createElement("div");
            userDiv.className = "user";
            userDiv.innerHTML = `${user.firstname} ${user.lastname} Email: ${user.email}`; //string literal (case sensitive)
            userContainer.appendChild(userDiv);
        });
    }catch(error){
        console.error("Error: ", error);
        userContainer.innerHTML = "<p style='color:red'>Failed to get users</p>";
    }
}

fetchUsers();