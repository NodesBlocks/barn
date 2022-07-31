import React from "react";
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import {Button, ButtonGroup, DialogActions, DialogContent, Grid, IconButton, Stack, Typography} from "@mui/material";
import {useGlobalPreloader} from "../../../hooks/useGlobalPreloader";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import CloseIcon from '@mui/icons-material/Close';
import {useAppSelector} from "../../../hooks/hook";
import {useAppState} from "../../../hooks/useAppState";
import {useDialog} from "../../../hooks/use-dialog/DialogContext";
import {useTranslation} from "react-i18next";
import DelegateDialog from "../Delegation/DelegateDialog";
import RedelegateDialog from "../Delegation/RedelegateDialog";
import UndelegateDialog from "../Delegation/UndelegateDialog";
import DetailViewer from "../../TokenDetails/DetailViewer";
import {AssuredWorkloadRounded, CurrencyExchangeRounded} from "@mui/icons-material";
import {makeStyles} from "@mui/styles";
import {Theme} from "@mui/material/styles";

const useStyles = makeStyles((theme: Theme) => ({
    icon: {
        [theme.breakpoints.down('md')]: {
            fontSize: "large",
        }
    }
}));

export const DelegationButtons = ({stakeAmount, rowData}) => {
    const {openDialog} = useDialog();
    const {t} = useTranslation();

    if (typeof stakeAmount !== "number" || stakeAmount <= 0)
        return <><Button variant={"outlined"} color="success" onClick={() => openDialog(
            <DelegateDialog initialValidator={rowData}/>, t("delegateTitle"))}>Delegate</Button></>
    else
        return <>
            <Button variant={"outlined"} color="warning" onClick={() => openDialog(
                <RedelegateDialog initialValidator={rowData}/>, t("redelegateTitle"))}>Redelegate</Button>
            <Button variant={"outlined"} color="success" onClick={() => openDialog(
                <DelegateDialog initialValidator={rowData}/>, t("delegateTitle"))}>Delegate</Button>
            <Button variant={"outlined"} color="error" onClick={() => openDialog(
                <UndelegateDialog initialValidator={rowData}/>, t("undelegateTitle"))}>Undelegate</Button>
        </>
}

export const MobileDelegationDialog = ({
                                           isOpen,
                                           onRequestClose,
                                           data
                                       }) => {
    const {passivate} = useGlobalPreloader();
    const classes = useStyles();
    const {t} = useTranslation();
    const {
        appState: {
            chainInfo
        }
    } = useAppState();
    const handleClose = () => {
        onRequestClose();
        passivate();
    };

    const delegations = useAppSelector(state => state.accounts.delegations.result);
    const balance = useAppSelector(state => state.accounts.balance.result);

    const getStakeAmount = (row) => {
        //@ts-ignore
        const decimals = chainInfo?.decimals | 6;
        let value = delegations.find((val) =>
            (val.delegation && val.delegation.validator_address) === row?.operator_address);
        return value ? value.balance && value.balance.amount && value.balance.amount / 10 ** decimals : 0;
    }

    const handleBalance = () => {
        //@ts-ignore
        const decimals = chainInfo?.decimals | 6;
        //@ts-ignore
        const bal = balance && balance.length && balance.find((val) => val.denom === chainInfo?.denom);
        return bal?.amount / (10 ** decimals) || 0;
    }

    return (
        <Dialog onClose={handleClose}
                open={isOpen}
                fullWidth
                maxWidth={"xs"}
                PaperProps={{
                    style: {borderRadius: 10}
                }}
        >
            <DialogTitle
                sx={{bgcolor: 'background.paper', alignItems: "center"}}>
                <ListItem key={data?.description?.moniker + data?.rank} sx={{alignItems: "center", p: 0}}>
                    <Typography sx={{pr: 1}}>#{data?.rank}</Typography>
                    <ListItemAvatar>
                        {   //@ts-ignore
                            <Avatar src={data?.keybase_image}/>
                        }
                    </ListItemAvatar>
                    <ListItemText primary={data?.description?.moniker}
                                  secondary={parseFloat((Number(data?.commission?.commission_rates?.rate) * 100).toFixed(2)) + "%"}/>
                </ListItem>
                {onRequestClose ? (
                    <IconButton
                        aria-label="close"
                        onClick={onRequestClose}
                        size={"small"}
                        sx={{
                            position: 'absolute',
                            right: 10,
                            top: 15,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon fontSize="small"/>
                    </IconButton>
                ) : null}
            </DialogTitle>
            <DialogContent sx={{bgcolor: 'background.paper'}}>
                <Stack direction={"row"} justifyContent={"space-between"} 
                       sx={{bgcolor: 'background.paper', mt: 2, mb: 2, ml: 5}}>
                    <DetailViewer title={t("dashboard.availableAmount")} amount={handleBalance().toFixed(3)}
                                  icon={<CurrencyExchangeRounded className={classes.icon} color={"secondary"}/>}/>
                    <DetailViewer title={t("dashboard.stakedAmount")} amount={getStakeAmount(data).toFixed(3)}
                                  icon={<AssuredWorkloadRounded className={classes.icon} color={"secondary"}/>}/>
                </Stack>
            </DialogContent>
            <DialogActions sx={{bgcolor: 'background.paper', justifyContent: "center"}}>
                <DelegationButtons
                    stakeAmount={getStakeAmount(data)}
                    rowData={data}/>
            </DialogActions>
        </Dialog>
    )
};
