import * as React from 'react';
import {Box, Button, CircularProgress, Grid, IconButton, Stack, Typography} from "@mui/material";
import SummaryTable from "./SummaryTable";
import {useTranslation} from "react-i18next";
import {useAppDispatch, useAppSelector} from "../../customHooks/hook";
import allActions from "../../action";
import {gas} from "../../constants/defaultGasFees";
import {getAllBalances, signTxAndBroadcast} from "../../services/cosmos";
import {useState} from "react";
import {useSnackbar} from "notistack";
import {snackbarTxAction} from "../Snackbar/action";
import {useAppState} from "../../context/AppStateContext";
import {config} from "../../constants/networkConfig";

function Index(props) {
    const {rows} = props;
    const {t} = useTranslation();
    const dispatch = useAppDispatch();
    const {enqueueSnackbar} = useSnackbar();
    const {
        appState: {
            chains
        }
    } = useAppState();

    const [inTxProgress, setInTxProgress] = useState(false);

    const rewards = useAppSelector(state => state.accounts.rewards.result);
    const address = useAppSelector(state => state.accounts.address.value);
    const delegations = useAppSelector(state => state.accounts.delegations.result);

    const handleRewards = () => {
        //@ts-ignore
        const decimals = chains?.decimals | 6;
        return rewards && rewards.total && rewards.total.length &&
        rewards.total[0] && rewards.total[0].amount
            ? rewards.total[0].amount / 10 ** decimals : 0;
    }

    const getStakedAmount = () => {
        //@ts-ignore
        const decimals = chains?.decimals | 6;
        const staked = delegations.reduce((accumulator, currentValue) => {
            return accumulator + Number(currentValue.balance.amount);
        }, 0);
        return staked / (10 ** decimals);
    }


    const updateBalance = () => {
        //@ts-ignore
        const decimals = chains?.decimals | 6;
        const tokens = rewards && rewards.length && rewards[0] && rewards[0].reward &&
        rewards[0].reward.length && rewards[0].reward[0] && rewards[0].reward[0].amount
            ? rewards[0].reward[0].amount / 10 ** decimals : 0;
        //@ts-ignore
        getAllBalances(chains?.chain_id, address, (err, data) => dispatch(allActions.getBalance(err, data)));
        dispatch(allActions.fetchVestingBalance(address));
        dispatch(allActions.fetchRewards(address));
        dispatch(allActions.setTokens(tokens));
    }

    const handleClaimAll = () => {
        setInTxProgress(true);
        let gasValue = gas.claim_reward;
        if (rewards && rewards.rewards && rewards.rewards.length > 1) {
            gasValue = (rewards.rewards.length - 1) / 2 * gas.claim_reward + gas.claim_reward;
        }

        const updatedTx = {
            msgs: [],
            fee: {
                amount: [{
                    amount: String(gasValue * config.GAS_PRICE_STEP_AVERAGE),
                    //@ts-ignore
                    denom: chains?.denom,
                }],
                gas: String(gasValue),
            },
            memo: '',
        };

        if (rewards?.rewards?.length) {
            rewards?.rewards?.map((item) => {
                updatedTx.msgs.push({
                    //@ts-ignore
                    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
                    value: {
                        //@ts-ignore
                        delegatorAddress: address,
                        //@ts-ignore
                        validatorAddress: item.validator_address,
                    },
                });
                return null;
            });
        }

        //@ts-ignore
        signTxAndBroadcast(chains?.chain_id, updatedTx, address, (error, result) => {
            setInTxProgress(false);
            if (error) {
                enqueueSnackbar(error, {variant: "error"});
                return;
            }
            if (result) {
                enqueueSnackbar(result?.transactionHash, {
                    variant: "success",
                    autoHideDuration: 3000,
                    action: (key) => snackbarTxAction(result?.transactionHash)(key)
                });
                updateBalance();
            }
        });
    };

    return (
        <React.Fragment>
            <Grid container rowSpacing={0.5}>
                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="space-between">
                        <div>
                            <Typography variant={"h6"}>{
                                //@ts-ignore
                                t("staking.name", {"name": chains?.pretty_name})
                            }</Typography>
                            <Typography variant={"body1"}
                                        style={{color: "rgb(131 157 170)"}}>{t("staking.totalStaked", {
                                "value": getStakedAmount()
                            })}</Typography>
                        </div>
                        <Button variant="outlined"
                                color="secondary"
                                disabled={inTxProgress || handleRewards() <= 0}
                                onClick={() => handleClaimAll()}
                                size="small"
                                sx={{height: "fit-content"}}>
                            {inTxProgress && <CircularProgress color="inherit" size={20} sx={{mr: 1}}/>}
                            <Box sx={{display: {xs: "none", md: 'block'}}}>
                                {t("claimReward", {
                                    "value": handleRewards().toFixed(3),
                                    //@ts-ignore
                                    "name": chains?.denom
                                })}
                            </Box>
                            <Box sx={{display: {xs: "block", md: 'none'}}}>
                                {t("claimAll")}
                            </Box>
                        </Button>
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <SummaryTable rows={rows}/>
                </Grid>
            </Grid>
        </React.Fragment>
    );
}

export default Index;
