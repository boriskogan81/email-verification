$(document).ready(function(){
    $("#pwd2").blur(function(){
        let pass1 = $("#pwd1").val();
        let pass2 = $("#pwd2").val();
        if(pass1 === pass2){
            $("#submit").prop("disabled", false);
    }});
});