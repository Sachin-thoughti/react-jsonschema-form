import React, { Component } from "react";
import PropTypes from "prop-types";
import Rodal from "rodal";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${
  pdfjs.version
}/pdf.worker.js`;

import { dataURItoBlob, shouldRender } from "../../utils";

function addNameToDataURL(dataURL, name) {
  return dataURL.replace(";base64", `;name=${encodeURIComponent(name)};base64`);
}

function processFile(file) {
  const { name, size, type } = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = reject;
    reader.onload = event => {
      resolve({
        dataURL: addNameToDataURL(event.target.result, name),
        name,
        size,
        type,
      });
    };
    reader.readAsDataURL(file);
  });
}

function processFiles(files) {
  return Promise.all([].map.call(files, processFile));
}

function FilesInfo(props) {
  const {
    filesInfo,
    visible,
    animation,
    modalWidth,
    values,
    pageNumber,
  } = props;
  if (filesInfo.length === 0) {
    return null;
  }
  return (
    <ul className="file-info">
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        let cleanUpName = decodeURI(name);
        return (
          <li key={key}>
            <strong>{cleanUpName}</strong> ({type}, {size} bytes)
            <br />
            <button
              type="button"
              title="View File"
              className="btn-shadow btn btn-primary"
              onClick={props.show.bind(this)}>
              View
            </button>
            <Rodal
              visible={visible}
              onClose={props.hide.bind(this)}
              animation={animation}
              showMask={false}
              width={modalWidth}>
              <PerfectScrollbar style={{ textAlign: "center" }}>
                <RodalContent
                  type={type}
                  filedata={values[0]}
                  pageNumber={pageNumber}
                />
              </PerfectScrollbar>
            </Rodal>
          </li>
        );
      })}
    </ul>
  );
}

function RodalContent(props) {
  const { type, filedata, pageNumber } = props;
  if (type === "application/pdf") {
    return (
      <Document file={filedata}>
        <Page pageNumber={pageNumber} />
      </Document>
    );
  } else if (
    type === "image/jpeg" ||
    type === "image/bmp" ||
    type === "image/png" ||
    type === "image/gif"
  ) {
    return <img src={filedata} />;
  }
}

function extractFileInfo(dataURLs) {
  return dataURLs
    .filter(dataURL => typeof dataURL !== "undefined")
    .map(dataURL => {
      const { blob, name } = dataURItoBlob(dataURL);
      return {
        name: name,
        size: blob.size,
        type: blob.type,
      };
    });
}

class FileWidget extends Component {
  constructor(props) {
    super(props);
    const { value } = props;
    const values = Array.isArray(value) ? value : [value];
    this.state = {
      values,
      filesInfo: extractFileInfo(values),
      visible: false,
      modalWidth: 1000,
      animation: "slideUp",
      pageNumber: 1,
      numPages: null,
    };
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  show() {
    this.setState({ visible: true });
  }

  hide() {
    this.setState({ visible: false });
  }

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ numPages });
  };

  onChange = event => {
    const { multiple, onChange } = this.props;
    processFiles(event.target.files).then(filesInfo => {
      const state = {
        values: filesInfo.map(fileInfo => fileInfo.dataURL),
        filesInfo,
      };
      this.setState(state, () => {
        if (multiple) {
          onChange(state.values);
        } else {
          onChange(state.values[0]);
        }
      });
    });
  };

  render() {
    const { multiple, id, readonly, disabled, autofocus, options } = this.props;
    return (
      <div>
        <p>
          <input
            ref={ref => (this.inputRef = ref)}
            id={id}
            type="file"
            disabled={readonly || disabled}
            onChange={this.onChange}
            defaultValue=""
            autoFocus={autofocus}
            multiple={multiple}
            accept={options.accept}
          />
        </p>
        <FilesInfo
          filesInfo={this.state.filesInfo}
          show={this.show}
          hide={this.hide}
          onDocumentLoadSuccess={this.onDocumentLoadSuccess}
          values={this.state.values}
          visible={this.state.visible}
          modalWidth={this.state.modalWidth}
          animation={this.state.animation}
          pageNumber={this.state.pageNumber}
          numPages={this.state.numPages}
        />
      </div>
    );
  }
}

FileWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  FileWidget.propTypes = {
    multiple: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    autofocus: PropTypes.bool,
  };
}

export default FileWidget;
