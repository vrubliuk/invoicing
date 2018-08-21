$(document).ready(function () {
    document.getElementById('invoicingButton').click();
    // refresh page each 20 minutes
    setInterval(function () {
        location.reload();
    }, 1200000);

});

var activeSection = "invoicing";

//SECTIONS BEHAVIOUR
// $("#invoicing").fadeIn("slow");
$("#invoicingButton").css("width", "170px");
$(".sectionLinks").click(function () {
    $(this).css("width", "170px");
    $(".sectionLinks").not(this).css("width", "");
    var sectionButton = $(this).attr('id');
    var sectionButtonName = sectionButton.replace("Button", "");
    activeSection = sectionButtonName;
    $(".sectionContent").each(function () {
        var sectionName = $(this).attr('id');
        if (sectionName === sectionButtonName) {
            if (sectionName === 'invoicing') {
                $(this).css("display", "table");
                pinSearchSectionInvoicing();
            } 
            // else if (sectionName === 'requirements') {
            //     $(this).css("display", "block");
            //     pinSearchSectionRequirements();
            // } else {
            //     $(this).css("display", "block");
            // }
        } else {
            $(this).css("display", "none");
        }
    });
    var color = $(this).css("background-color");
    $("#arrowUp").css("color", color);

});

//---------------------------INVOICING SECTION-----------------------------

var invoicingSection = new Vue({
    el: '#invoicing',
    data: {
        googleSpreadsheetId: "1qz3MtI-Aw7O1YzWkCNnBL3bjmMo5hYN1div9rkxmndg",
        worksheet: "od6",
        input: '',
        filters: ['0-9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'all'],
        filteredBy: '',
        table: [],
        columnsToShow: []
    },

    beforeMount: function () {
        if (typeof (Storage) !== "undefined" && localStorage.getItem("columnsToShowFromLocalStorage")) {
            var columnsToShowFromLocalStorage = JSON.parse(localStorage.getItem("columnsToShowFromLocalStorage"));
            var updatedColumnsToShow = this.allColumns.filter(function (elem) {
                if (!(elem in columnsToShowFromLocalStorage)) {
                    return true;
                } else {
                    return columnsToShowFromLocalStorage[elem] ? true : false;
                }
            });
            if (updatedColumnsToShow.length) {
                this.columnsToShow = updatedColumnsToShow.slice();
            } else {
                this.columnsToShow = this.allColumns;
            }
        } else {
            this.columnsToShow = this.allColumns;
        }
    },

    computed: {
        browserIsIE: function () {
            return !!(navigator.userAgent.indexOf("MSIE ") > -1 || navigator.userAgent.indexOf("Trident/") > -1);
        },
        spreadsheet: function () {
            var url = "https://spreadsheets.google.com/feeds/list/" + this.googleSpreadsheetId + "/" + this.worksheet + "/public/values?alt=json";
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            try {
                xhr.send();
                var data = JSON.parse(xhr.responseText);
                var entries = data.feed.entry;
                var finalArray = [];
                for (var i = 0; i < entries.length; i++) {
                    finalArray[i] = {};
                    for (var propertyName in entries[i]) {
                        if (propertyName.slice(0, 3) === 'gsx') {
                            var columnName = propertyName.split('$')[1];
                            finalArray[i][columnName] = entries[i][propertyName].$t;
                        }
                    }
                }
                return finalArray;
            } catch (error) {
                console.log("The resource file for invoicing section is not found");
            }
        },
        spreadsheetSorted: function () {
            var spreadsheet = this.spreadsheet.slice();
            var _this = this;
            spreadsheet.sort(function (a, b) {
                var x = a[_this.firstColumnName].toLowerCase();
                var y = b[_this.firstColumnName].toLowerCase();
                if (x < y) {
                    return -1;
                }
                if (x > y) {
                    return 1;
                }
                return 0;
            });
            var updatedSpreadsheet = this.removeEmptyRows(spreadsheet);
            return updatedSpreadsheet;
        },
        firstColumnName: function () {
            var name = '';
            for (var prop in this.spreadsheet[0]) {
                name = prop;
                break;
            }
            return name;
        },
        idColumnName: function () {
            var name = '';
            for (var prop in this.spreadsheet[0]) {
                if (this.spreadsheet[0][prop].charAt(6) === "-") {
                    name = prop;
                    break;
                }
            }
            return name;
        },
        allColumns: function () {
            var columnNames = [];
            for (var prop in this.spreadsheet[0]) {
                columnNames.push(prop);
            }
            return columnNames;
        },
        showError: function () {
            if (this.filteredBy.length !== 0 && this.table.length === 0) {
                return true;
            } else
            if (this.input.length > 2 && this.table.length === 0) {
                return true;
            } else {
                return false;
            }
        },
        showErrorColumns: function () {
            if (this.columnsToShow.length === 0) {
                return true;
            } else {
                return false;
            }
        }
    },

    watch: {
        columnsToShow: function () {
            if (typeof (Storage) !== "undefined") {
                var columnsToShow = this.columnsToShow;
                var columnsToShowFromLocalStorage = {};
                this.allColumns.forEach(function(elem){
                    if (columnsToShow.indexOf(elem) > -1){
                        columnsToShowFromLocalStorage[elem] = true;
                    } else {
                        columnsToShowFromLocalStorage[elem] = false;
                    }
                });
                localStorage.setItem("columnsToShowFromLocalStorage", JSON.stringify(columnsToShowFromLocalStorage));
            }
        },
        input: function () {
            if (this.input.length > 2) {
                var filter = this.input.toLowerCase();
                var spreadsheet = this.spreadsheetSorted.slice();
                var filteredSpreadsheet = [];
                for (var i = 0; i < spreadsheet.length; i++) {

                    if (spreadsheet[i][this.firstColumnName].toLowerCase().indexOf(filter) > -1 ||
                        spreadsheet[i][this.idColumnName].toLowerCase().indexOf(filter) > -1) {
                        filteredSpreadsheet.push(spreadsheet[i]);
                    }
                }
                this.table = filteredSpreadsheet.slice();
            } else if (this.input.length > 0) {

                this.filteredBy = '';
                this.table = [];
            }
        }
    },

    methods: {
        filterByAlphabet: function (option) {
            this.input = "";
            if (this.filteredBy === option) {
                this.table = [];
                this.filteredBy = '';
            } else {
                this.filteredBy = option;
                if (option === 'all') {
                    this.table = this.spreadsheetSorted;
                } else {
                    var spreadsheet = this.spreadsheetSorted.slice();
                    var filteredSpreadsheet = [];
                    if (option === '0-9') {
                        for (var i = 0; i < spreadsheet.length; i++) {
                            var firstColumnValue = spreadsheet[i][this.firstColumnName];
                            if (!isNaN(firstColumnValue.charAt(0))) {
                                filteredSpreadsheet.push(spreadsheet[i]);
                            }
                        }
                    } else {
                        for (var i = 0; i < spreadsheet.length; i++) {
                            var firstColumnValue = spreadsheet[i][this.firstColumnName];
                            if (firstColumnValue.charAt(0).toLowerCase().match(option)) {
                                filteredSpreadsheet.push(spreadsheet[i]);
                            }
                        }
                    }
                    this.table = filteredSpreadsheet.slice();
                }
            }
        },
        removeEmptyRows: function (spreadsheet) {
            var updatedSpreadsheet = [];
            for (var i = 0; i < spreadsheet.length; i++) {
                for (var prop in spreadsheet[i]) {
                    if (spreadsheet[i][prop] !== '') {
                        updatedSpreadsheet.push(spreadsheet[i]);
                    }
                    break;
                }
            }
            return updatedSpreadsheet;
        },
        removeAlphabetFilters: function () {
            if (this.filteredBy.length > 0) {
                this.filteredBy = '';
                this.table = [];
            }
        }
    }
});

//SCROLL TO THE TOP BUTTON
// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
    showUpButton();
    if (activeSection === "invoicing") pinSearchSectionInvoicing();
};

function showUpButton() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("arrowUp").style.display = "block";
    } else {
        document.getElementById("arrowUp").style.display = "none";
    }
}

function pinSearchSectionInvoicing() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementsByClassName("searchSection2")[0].style.position = "fixed";
        document.getElementById("invoicing").style.paddingTop = "0px";
        document.getElementsByClassName("invoicingTableSection")[0].style.marginTop = "100px";
        $(".alphabet2").css('display', 'none');
        $("#myInput2").css('width', '460px');
        $(".searchSection2").css('left', '50%');
        $(".searchSection2").css('margin-left', '-250px');
        $(".searchSection2").css('height', '50px');
        $(".searchSection2").css('width', '500px');
        $('.invoicingSettingsDropdownContent').css('width', '500px');
    } else {
        document.getElementsByClassName("searchSection2")[0].style.position = "";
        document.getElementById("invoicing").style.paddingTop = "";
        document.getElementsByClassName("invoicingTableSection")[0].style.marginTop = "";
        $(".alphabet2").css('display', '');
        $("#myInput2").css('width', '');
        $(".searchSection2").css('left', '');
        $(".searchSection2").css('margin-left', '');
        $(".searchSection2").css('height', '');
        $(".searchSection2").css('width', '');
        $('.invoicingSettingsDropdownContent').css('width', '');
    }
}

window.onresize = function () {
    var requirementsWidth = $("#requirements").width();
    document.getElementsByClassName("searchSection")[0].style.width = requirementsWidth + "px";
}

// When the user clicks on the button, scroll to the top of the document
$("#arrowUp").click(function () {
    $('html, body').animate({
        scrollTop: "0px"
    }, 500);
});

// DYNAMICALLY CHANGE COLOR OF EVEN ROWS OF "CUSTOMER REQUIREMENTS" TABLE
function setTableRowsColor(tableName) {
    $('#' + tableName + 'Table tr').css("background-color", "white");
    $('#' + tableName + 'Table tr').filter(function () {
        return $(this).css('display') !== 'none';
    }).filter(":even").css("background-color", "#f1f1f1");
    $('#' + tableName + 'Table tr').hover(
        function () {
            $(this).addClass(tableName + "TableRowHover");
        },
        function () {
            $(this).removeClass(tableName + "TableRowHover");
        }
    );
}