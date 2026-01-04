tinymce.init({
  // console.log("OK");
  selector: "textarea",
  plugins: "image imagetools",
  toolbar:
    "undo redo | image undo redo | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist ",
  menubar: "file edit view insert format",

  file_picker_callback: function (cb, value, meta) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = function () {
      var file = this.files[0];

      var reader = new FileReader();
      reader.onload = function () {
        var id = "blobid" + new Date().getTime();
        var editor = tinymce.activeEditor;
        var blobCache = editor.editorUpload.blobCache;

        var base64 = reader.result.split(",")[1];
        var blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);

        cb(blobInfo.blobUri(), { title: file.name });
      };
      reader.readAsDataURL(file);
    };
    // console.log("TINYMCE OK")
    input.click();
  },
});
