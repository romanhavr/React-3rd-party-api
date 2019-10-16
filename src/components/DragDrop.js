import React from 'react';
import { gapi } from 'gapi-script';
import '../styles/drag-drop.css';

class DragDrop extends React.Component {
  constructor() {
    super()
    this.googleLoginRef = React.createRef();
    this.dropAreaRef = React.createRef();
    this.dropExtensionsRef = React.createRef();
    this.previewRef = React.createRef();
    // this.butRef = React.createRef();
    this.resultRef = React.createRef();
    this.uploadedFilesRef = React.createRef();
    this.progressRef = React.createRef();

    this.initClient = this.initClient.bind(this);
    this.setDefaults = this.setDefaults.bind(this);
    this.setSigninStatus = this.setSigninStatus.bind(this);
    this.highlight = this.highlight.bind(this);
    this.unhighlight = this.unhighlight.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.preloadPreviewFile = this.preloadPreviewFile.bind(this);
    this.butClick = this.butClick.bind(this);
    this.handleFiles = this.handleFiles.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.previewFile = this.previewFile.bind(this);
    this.googleLoginClick = this.googleLoginClick.bind(this);

    // this.state = {
    //   minTime: '2005-04-24T00:00',
    // }
  }

  googleLogin;
  dropArea;
  dropExtensions;
  preview;
  // but;
  result;
  uploadedFiles;
  progress;

  files = [];
  token = '';
  GoogleAuth;
  url = 'https://www.googleapis.com/upload/drive/v3/files';
  SCOPE = 'https://www.googleapis.com/auth/drive.file';
  discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

  // Google login logic
  componentDidMount() {
    this.setDefaults();
    gapi.load('client:auth2', this.initClient);
  };

  initClient() {
    gapi.client.init({
      'apiKey': 'AIzaSyBWpeOYpvTB5vQAbaQYhY4BG5hGYS_dctk',
      // 'apiKey': 'AIzaSyAhnjJNA4H1jwyyNBJUqnwNMJauUSb-cxQ',
      'discoveryDocs': [this.discoveryUrl],
      'clientId': '242985755560-8ah2i5rtar01gcrfnc9lr5jj1s1gdsjk.apps.googleusercontent.com',
      // 'clientId': '242985755560-k6d60p7l9gm5v4bdcup9tooa8v6b1mvm.apps.googleusercontent.com',
      'scope': this.SCOPE
    }).then(() => {
      this.GoogleAuth = gapi.auth2.getAuthInstance();
      this.GoogleAuth.isSignedIn.listen(this.googleLoginClick);

      this.setSigninStatus();
    });
  };

  setDefaults() {
    this.googleLogin = this.googleLoginRef.current;
    this.dropArea = this.dropAreaRef.current;
    this.dropExtensions = this.dropExtensionsRef.current;
    this.preview = this.previewRef.current;
    // this.but = this.butRef.current;
    this.result = this.resultRef.current;
    this.uploadedFiles = this.uploadedFilesRef.current;
    this.progress = this.progressRef.current;

    // EventListener operations
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropArea.addEventListener(eventName, preventDefaults);
      window.addEventListener(eventName, preventDefaults);
    });

    function preventDefaults(e) {
      e.preventDefault()
    };

    window.addEventListener('dragenter', this.highlight);
    window.addEventListener('dragover', this.highlight);

    window.addEventListener('dragleave', this.unhighlight);
    window.addEventListener('drop', this.unhighlight);
    this.dropArea.addEventListener('drop', this.unhighlight);

    this.dropArea.addEventListener('drop', this.handleDrop);
  }

  // Highlighting / unhighlighting of droparea
  highlight() {
    this.dropArea.classList.add('highlight');

    this.dropExtensions.style.animation = 'none';
    this.result.style.animation = 'none';
    this.result.innerHTML = '';

    window.removeEventListener('dragenter', this.highlight);
    window.removeEventListener('dragover', this.highlight)
  };

  unhighlight() {
    this.dropArea.classList.remove('highlight');

    window.addEventListener('dragenter', this.highlight);
    window.addEventListener('dragover', this.highlight);
  };

  // Handling "drop" event
  handleDrop(e) {
    let newFiles = [];
    let repeat;

    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      repeat = false;
      if (this.files.length === 0) {
        newFiles.push(e.dataTransfer.files[i]);
      } else {
        for (let j = 0; j < this.files.length; j++) {
          if (this.files[j].name === e.dataTransfer.files[i].name) {
            repeat = true
          }
        };
        if (!repeat) {
          newFiles.push(e.dataTransfer.files[i])
        }
      }
    };

    for (let i = 0; i < newFiles.length; i++) {
      if (newFiles[i].name.slice(-3) === 'jpg' ||
        newFiles[i].name.slice(-3) === 'png' ||
        newFiles[i].name.slice(-3) === 'gif' ||
        newFiles[i].name.slice(-3) === 'pdf' ||
        newFiles[i].name.slice(-3) === 'peg' ||
        newFiles[i].name.slice(-4) === 'jpeg') {
        this.files.push(newFiles[i]);
      } else {
        this.dropExtensions.style.animation = 'blink-red .5s step-end infinite alternate';
        this.result.style.color = 'black';
        this.result.style.animation = 'blink-red .5s step-end infinite alternate';
        this.result.innerHTML = '* only ".jpg", ".jpeg", ".png", "gif" or ".pdf" files can be uploaded.';
      }
    };

    this.preview.innerHTML = '';
    this.files.forEach(this.preloadPreviewFile)
  };

  // Handling "upload" button click
  butClick() {
    this.handleFiles(this.files);

    let imgs = this.preview.querySelectorAll('img');
    for (let i = 0; i < imgs.length; i++) {
      this.preview.removeChild(imgs[i])
    };

    this.dropExtensions.style.animation = 'none';
    this.result.style.animation = 'none';
    this.result.innerHTML = '';
    this.progress.innerHTML = '(Uploading file(s)...)'
    this.files = []
  }

  handleFiles(files) {
    files = [...files];
    files.forEach(this.uploadFile);
    files = []
  };

  uploadFile(file) {

    let xhr = new XMLHttpRequest();
    let formData = new FormData();

    xhr.open('POST', this.url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
    xhr.setRequestHeader('X-Upload-Content-Length', file.size);
    xhr.setRequestHeader('X-Upload-Content-Name', file.name);

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState < 4) {
        this.progress.innerHTML = '(Uploading file(s)...)'
      } else if (xhr.readyState === 4 && xhr.status === 200) {
        this.previewFile(file);
        this.progress.innerHTML = '(Success uploading.)'
        gapi.client.drive.files.update({
          'fileId': JSON.parse(xhr.responseText).id,
          'name': file.name
        }).execute()
      }
      else if (xhr.readyState === 4 && xhr.status !== 200) {
        this.result.innerHTML = `ERROR occured during upload. Error status: ${xhr.status} (${xhr.statusText})`
      }
    });

    formData.append("file", file, file.name);
    formData.append("upload_file", true);

    xhr.send(formData);
  };

  // Previewing dropped files
  preloadPreviewFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      let img = document.createElement('img');
      img.src = reader.result;
      this.preview.appendChild(img)
    }
  };

  // Previewing uploaded files
  previewFile(file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      let img = document.createElement('img');
      img.src = reader.result;
      this.uploadedFiles.appendChild(img)
    }
  };

  googleLoginClick() {
    if (this.GoogleAuth.isSignedIn.get()) {
      this.GoogleAuth.signOut();
    } else {
      this.GoogleAuth.signIn();
    }
  };

  setSigninStatus() {
    const user = this.GoogleAuth.currentUser.get();
    this.token = user.Zi ? user.Zi.access_token : '';

    let isAuthorized = user.hasGrantedScopes(this.SCOPE);
    if (isAuthorized) {
      this.googleLogin.innerHTML = `Sign out <b><u>(` + user.w3.ofa + `)</u></b>`;
    } else {
      this.googleLogin.innerHTML = `Sign in your&nbsp;
                                <img src='logo-drive.png'>&nbsp;
                                Google account.`;
    }
  };

  render() {
    return (
      <div className="content">
        <h1>
          <img src='drag-drop.png' alt="Drag&#38;Drop Uploader Logo" />
          &nbsp;Drag and Drop Web File Uploader
      </h1>
        <div
          className='google-login'
          ref={this.googleLoginRef}
          onClick={this.googleLoginClick}
        >
        </div>
        <div className='drop-area' ref={this.dropAreaRef}>
          <h3>Drag and drop file(s) here:</h3>
          <span ref={this.dropExtensionsRef}>
            * only ".jpg", ".jpeg", ".png", "gif" or ".pdf".
        </span>
          <div ref={this.previewRef}></div>
        </div>
        <input 
          type='button'
          className="but"
          value='Upload'
          onClick={this.butClick}  
        />
        <span ref={this.resultRef} className="result"></span>
        <div className='uploaded-files' ref={this.uploadedRef}>
          <p>
            Uploaded files:
          <span ref={this.progressRef} className="progress"></span>
          </p>
        </div>
      </div>
    );
  }
}

export default DragDrop;
